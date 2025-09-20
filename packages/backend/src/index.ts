import { Hono } from "hono";
import { db } from "./db";
import { runScraper } from "./scraper";
import cron from "node-cron";

const app = new Hono();

app.get("/api/imoveis", async (c) => {
  try {
    const todosImoveis = await db.query.imoveis.findMany({
      orderBy: (imoveis, { desc }) => [desc(imoveis.createdAt)],
    });
    return c.json({ success: true, data: todosImoveis });
  } catch (error) {
    console.error("Erro ao buscar imóveis:", error);
    return c.json({ success: false, error: "Erro interno do servidor" }, 500);
  }
});

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

console.log("Scraper agendado para rodar às 8h e 18h (Horário de Brasília).");
console.log(
  "Endpoint manual do scraper: POST http://localhost:3000/api/scraper/run",
);

export default {
  port: 3000,
  fetch: app.fetch,
};

console.log("Servidor Hono rodando em http://localhost:3000");
