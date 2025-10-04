import { db } from "@/db";
import { notificationsQueue, type NewImovel } from "@/db/schema";
import type { UserPreferences } from "@/types";
import { doesImovelMatchLocationRules } from "./mapsService";

/**
 * Verifica se um único imóvel corresponde a um conjunto de preferências de usuário.
 */
async function doesImovelMatchPreferences(
  imovel: NewImovel,
  preferences: UserPreferences,
): Promise<boolean> {
  // 1. Filtros básicos

  const [minRent, maxRent] = preferences.price.rent;
  const valorAluguel = imovel.valor_aluguel ?? 0;
  const isRentInPriceRange = valorAluguel <= maxRent && valorAluguel >= minRent;

  const valorCondomino = imovel.valor_condominio ?? 0;
  const [minCondo, maxCondo] = preferences.price.condo;
  const isCondoInPriceRange =
    valorCondomino <= maxCondo && valorCondomino >= minCondo;

  const quartos = imovel.quartos ?? 0;
  const isWithinBedroomRange = quartos >= preferences.bedrooms;

  const vagas = imovel.quartos ?? 0;
  const isWithinVagasRange = vagas >= preferences.parkingSpots;

  const isExactMatch =
    isRentInPriceRange &&
    isCondoInPriceRange &&
    isWithinBedroomRange &&
    isWithinVagasRange;

  if (!isExactMatch) {
    return false;
  }

  // 2. Filtro de localização (o mais custoso, fica por último)
  const locationMatch = await doesImovelMatchLocationRules(
    imovel,
    preferences.locations,
  );
  if (!locationMatch || !locationMatch.isMatch) {
    return false;
  }

  // Se passou por todos os filtros, é um match!
  return true;
}

/**
 * Serviço principal que é executado após o scraping.
 * Compara os novos imóveis com todos os perfis de usuários e enfileira notificações.
 */
export async function runMatchingAndQueueNotifications(
  newImoveis: NewImovel[],
) {
  if (newImoveis.length === 0) {
    console.log("Matcher: Nenhum imóvel novo para processar.");
    return;
  }
  console.log(
    `Matcher: Iniciando processamento de ${newImoveis.length} novos imóveis.`,
  );

  const allUserPreferences = await db.query.preferences.findMany();

  if (allUserPreferences.length === 0) {
    console.log("Matcher: Nenhum perfil de usuário encontrado para comparar.");
    return;
  }

  let notificationsQueued = 0;

  // Para cada novo imóvel...
  for (const imovel of newImoveis) {
    // ...compara com as preferências de cada usuário.
    for (const pref of allUserPreferences) {
      const isMatch = await doesImovelMatchPreferences(
        imovel,
        pref.filters as UserPreferences,
      );

      if (isMatch) {
        console.log(
          `=> MATCH ENCONTRADO! Imóvel ${imovel.id} para o usuário ${pref.userId}`,
        );
        // Tenta inserir na fila. Graças ao índice único, inserções duplicadas falharão silenciosamente.
        try {
          await db.insert(notificationsQueue).values({
            userId: pref.userId,
            imovelId: imovel.id!,
          });
          notificationsQueued++;
        } catch (error) {
          // Ignora erros de violação de chave única (significa que já foi notificado)
          if (
            !(
              error instanceof Error &&
              "code" in error &&
              error.code === "23505"
            )
          ) {
            console.error("Matcher: Erro ao enfileirar notificação:", error);
          }
        }
      }
    }
  }

  console.log(
    `Matcher: Processo finalizado. ${notificationsQueued} novas notificações foram enfileiradas.`,
  );
}
