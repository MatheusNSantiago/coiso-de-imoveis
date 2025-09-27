import { Hono } from "hono";
import { db } from "./db";
import { cors } from "hono/cors";
import { runScraper } from "./scraper";
import cron from "node-cron";

import { gte, and, lte } from "drizzle-orm";
import { imoveis } from "./db/schema";
import { doesImovelMatchLocationRules } from "./services/mapsService";
import type { UserPreferences } from "./types";

console.log("Iniciando o processo do LightPanda em segundo plano...");
const lightpandaProc = Bun.spawn(["./lightpanda", "serve", "--port", "9222"], {
  stdout: "inherit", // Redireciona a saída para o log principal
  stderr: "inherit", // Redireciona os erros para o log principal
});
console.log(`LightPanda iniciado com PID: ${lightpandaProc.pid}`);

const app = new Hono();

app.use("/api/*", cors());

app.get("/api/imoveis", async (c) => {
  try {
    const prefsString = c.req.query("preferences");
    if (!prefsString) {
      return c.json(
        { success: false, error: "Preferências não fornecidas" },
        400,
      );
    }

    const preferences: UserPreferences = JSON.parse(prefsString);
    console.log("Recebido para filtrar:", preferences);

    const imoveisFiltrados = await db.query.imoveis.findMany({
      where: and(
        gte(imoveis.valor_aluguel, preferences.price.rent[0]),
        lte(imoveis.valor_aluguel, preferences.price.rent[1]),
        gte(imoveis.valor_condominio, preferences.price.condo[0]),
        lte(imoveis.valor_condominio, preferences.price.condo[1]),
        gte(imoveis.quartos, preferences.bedrooms),
        gte(imoveis.vagas_garagem, preferences.parkingSpots),
        // gte(imoveis.suites, preferences.bathrooms), // Assumindo que banheiros = suítes
      ),
      orderBy: (imoveis, { desc }) => [desc(imoveis.createdAt)],
    });

    console.log(
      `Encontrados ${imoveisFiltrados.length} imóveis após filtro de preço.`,
    );

    const imoveisCompativeis = [];
    for (const imovel of imoveisFiltrados) {
      const { isMatch, matchedRules } = (await doesImovelMatchLocationRules(
        imovel,
        preferences.locations,
      )) ?? { isMatch: false, matchedRules: [] };

      if (isMatch) {
        imoveisCompativeis.push({ ...imovel, matchedRules });
      }
    }

    console.log(
      `Encontrados ${imoveisCompativeis.length} imóveis após todos os filtros.`,
    );
    return c.json({ success: true, data: imoveisCompativeis });
  } catch (error) {
    console.error("Erro ao processar a busca de imóveis:", error);
    return c.json({ success: false, error: "Erro interno do servidor" }, 500);
  }
});

// --- Endpoints e agendamentos auxiliares ---
app.post("/api/scraper/run", async (c) => {
  console.log("Acionando o scraper manualmente via API...");

  runScraper().catch((err) => {
    console.error("Erro ao executar o scraper manualmente:", err);
  });

  return c.json({
    success: true,
    message: "Scraper iniciado em segundo plano.",
  });
});

cron.schedule(
  "0 8,18 * * *", // "Às 08:00 e 18:00, todos os dias"
  () => {
    console.log("Executando o scraper agendado...");
    runScraper().catch((err) => {
      console.error("Erro na execução agendada do scraper:", err);
    });
  },
  { timezone: "America/Sao_Paulo" },
);

export default {
  port: process.env.PORT || 3000,
  hostname: "0.0.0.0",
  fetch: app.fetch,
  idleTimeout: 90,
};
