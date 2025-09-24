// src/scraper.ts
import puppeteer from "puppeteer-core";
import { db } from "./db";
import { imoveis } from "./db/schema";
import { eq } from "drizzle-orm";
import {
  fetchRecentImoveis,
  scrapeImovelData,
} from "./services/scrapingService";
import { sleep } from "bun";

export async function runScraper() {
  console.log("=========================================");
  console.log(
    `Iniciando execução do scraper em: ${new Date().toLocaleString("pt-BR")}`,
  );
  console.log("=========================================");

  let browser = await puppeteer.connect({
    browserWSEndpoint: "ws://127.0.0.1:9222",
  });

  try {
    const imovelEndpoints = await fetchRecentImoveis(browser, 8);
    let newImoveisAddedCount = 0;

    for (const imovelEndpoint of imovelEndpoints) {
      const imovelUrl = "https://www.dfimoveis.com.br" + imovelEndpoint;

      // 2.1. Caso já esteja no banco de dados, pode terminar o scraping.
      const existingImovel = await db.query.imoveis.findFirst({
        where: eq(imoveis.url, imovelUrl),
      });

      if (existingImovel) {
        // console.log(
        //   `Imóvel já existe no banco (${imovelEndpoint}). Finalizando a busca por novos imóveis.`,
        // );
        // break;
        continue
      }

      // 2.2. Caso não esteja, vai na url do anúncio e da impressão para pegar os dados.
      const imovel = await scrapeImovelData(browser, imovelEndpoint);
      if (!imovel) continue;

      if (!imovel.endereco){
        console.log(imovel)
      }

      await sleep(5000);

      try {
        await db.insert(imoveis).values(imovel as any);
        console.log(
          `=> Imóvel ${imovel.id} salvo com sucesso no banco de dados.`,
        );
        newImoveisAddedCount++;
      } catch (dbError) {
        console.error(`Erro ao salvar imóvel ${imovel.id} no banco:`, dbError);
      }
    }

    console.log(
      `\nProcesso finalizado. Total de novos imóveis adicionados: ${newImoveisAddedCount}`,
    );
  } catch (error) {
    console.error(
      "Um erro geral ocorreu durante a execução do scraper:",
      error,
    );
  } finally {
    await browser.disconnect();

    console.log("=========================================");
    console.log("Execução do scraper finalizada.");
    console.log("=========================================");
  }
}

// Permite que o script seja executado diretamente
if (import.meta.main) {
  runScraper();
}
