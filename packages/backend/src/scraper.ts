import { db } from "./db";
import { imoveis } from "./db/schema";
import { eq } from "drizzle-orm";
import {
  fetchRecentImoveis,
  scrapeImovelData,
} from "./services/scrapingService";
import { sleep } from "bun";
import { runMatchingAndQueueNotifications } from "./services/matchingService";
import type { NewImovel } from "./types";

export async function runScraper() {
  console.log("=========================================");
  console.log(
    `Iniciando execução do scraper em: ${new Date().toLocaleString("pt-BR")}`,
  );
  console.log("=========================================");

  const newImoveis: NewImovel[] = []; // Array para guardar novos imóveis

  try {
    const imovelEndpoints = await fetchRecentImoveis(15);

    for (const imovelEndpoint of imovelEndpoints) {
      const imovelUrl = "https://www.dfimoveis.com.br" + imovelEndpoint;

      // 2.1. Caso já esteja no banco de dados, pode terminar o scraping.
      const existingImovel = await db.query.imoveis.findFirst({
        where: eq(imoveis.url, imovelUrl),
      });

      if (existingImovel) {
        console.log(
          `Imóvel já existe no banco (${imovelEndpoint}). Finalizando a busca por novos imóveis.`,
        );
        continue
      }

      // 2.2. Caso não esteja, vai na url do anúncio e da impressão para pegar os dados.
      const imovelData = await scrapeImovelData(imovelEndpoint);
      if (!imovelData || !imovelData.id) continue;

      await sleep(5000); // Sleep pro cloudflare não me pegar

      try {
        await db.insert(imoveis).values(imovelData as NewImovel);
        console.log(
          `=> Imóvel ${imovelData.id} salvo com sucesso no banco de dados.`,
        );
        newImoveis.push(imovelData as NewImovel);
      } catch (dbError) {
        console.error(
          `Erro ao salvar imóvel ${imovelData.id} no banco:`,
          dbError,
        );
      }
    }

    console.log(
      `\nScraping finalizado. Total de novos imóveis adicionados: ${newImoveis.length}`,
    );

    if (newImoveis.length > 0) {
      await runMatchingAndQueueNotifications(newImoveis);
    }
  } catch (error) {
    console.error(
      "Um erro geral ocorreu durante a execução do scraper:",
      error,
    );
  } finally {
    console.log("=========================================");
    console.log("Execução do scraper finalizada.");
    console.log("=========================================");
  }
}

// Permite que o script seja executado diretamente
if (import.meta.main) {
  runScraper();
}
