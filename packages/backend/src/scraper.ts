import puppeteer from "puppeteer-core";
import { Browser } from "puppeteer";
import * as cheerio from "cheerio";
import { db } from "./db";
import { imoveis, type NewImovel } from "./db/schema";
import { eq } from "drizzle-orm";

async function getUrlsImoveisListados(browser: Browser) {
  const baseSiteUrl = "https://www.dfimoveis.com.br";
  const baseUrl = `${baseSiteUrl}/aluguel/df/todos/apartamento?ordenamento=mais-recente`;

  let urls_imoveis: string[] = [];

  for (let pagina = 1; pagina <= 1; pagina++) {
    console.log(`Buscando URLs na página ${pagina}...`);
    const page = await browser.newPage();

    try {
      await page.goto(`${baseUrl}&pagina=${pagina}`, {
        waitUntil: "networkidle2",
      });

      await page.waitForSelector(".new-card", { timeout: 20000 });

      const urlsDaPagina = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".new-card"))
          .map((card) => card.getAttribute("href"))
          .filter((href): href is string => href !== null);
      });

      urls_imoveis = urls_imoveis.concat(urlsDaPagina);
    } catch (error) {
      console.error(`Erro ao buscar URLs na página ${pagina}:`, error);
    } finally {
      await page.close();
    }
  }

  console.log(`Foram encontradas ${urls_imoveis.length} URLs de imóveis.`);
  return urls_imoveis;
}

async function extractImovelInfo(
  browser: Browser,
  imovelUrl: string,
): Promise<NewImovel | null> {
  const imovelId = imovelUrl.split("-").pop();
  const urlImpressao = `https://www.dfimoveis.com.br/imovel/impressao/${imovelId}`;

  const page = await browser.newPage();

  try {
    await page.goto(urlImpressao, { waitUntil: "networkidle2" });
    await page.waitForSelector(".table-print", { timeout: 15000 });

    const content = await page.content();
    const $ = cheerio.load(content);

    const getTableTextValue = (key: string): string => {
      const value = $(`.tlabel:contains("${key}")`).next("td").text().trim();
      return value || "";
    };

    const getTableMoneyValue = (key: string): string => {
      const textValue = getTableTextValue(key);
      return textValue.replace("R$", "").replace(".", "").trim();
    };

    console.log(`Sucesso ao extrair dados do ID ${imovelId}.`);
    return {
      codigo_imovel: getTableTextValue("Cód. Imóvel"),
      tipo: getTableTextValue("Tipo"),
      endereco: getTableTextValue("Endereço"),
      bairro: getTableTextValue("Bairro"),
      cidade: getTableTextValue("Cidade"),
      quartos: getTableTextValue("Quartos"),
      suites: getTableTextValue("Suite"),
      vagas_garagem: getTableTextValue("Garagem"),
      area_privativa: getTableTextValue("Área Privativa")
        ?.replace(" m²", "")
        .replace(",", "."),
      valor_aluguel: getTableMoneyValue("Valor do Imóvel Aluguel"),
      valor_condominio: getTableMoneyValue("Condomínio"),
      descricao: $("td.descricao").text().trim(),
      url: `https://www.dfimoveis.com.br${imovelUrl}`,
    };
  } catch (error) {
    console.error(`Erro ao extrair informações do ID ${imovelId}:`, error);
    return null;
  } finally {
    await page.close();
  }
}

export async function runScraper() {
  console.log("Iniciando o scraper...");
  let browser = await puppeteer.connect({
    browserWSEndpoint: "ws://127.0.0.1:9222",
  });

  const urls_imoveis = await getUrlsImoveisListados(browser);
  let novosImoveisAdicionados = 0;

  for (const url of urls_imoveis) {
    const info = await extractImovelInfo(browser, url);
    if (!info) continue;

    try {
      const isImovelOnDB = await db.query.imoveis.findFirst({
        where: eq(imoveis.codigo_imovel, info.codigo_imovel),
      });

      // Se já existir, quer dizer que já vimos todos os novos e podemos parar o scraper
      if (isImovelOnDB) break;

      await db.insert(imoveis).values(info);
      console.log(
        `=> Novo imóvel adicionado: ${info.codigo_imovel} - ${info.endereco}`,
      );
      novosImoveisAdicionados++;
    } catch (dbError) {
      console.error(
        `Erro ao interagir com o banco de dados para o código ${info.codigo_imovel}:`,
        dbError,
      );
    }
  }

  console.log(
    `\nScraping finalizado. Foram adicionados ${novosImoveisAdicionados} novos imóveis.`,
  );
  await browser.disconnect();
}

// Para permitir que este script seja executado diretamente via 'bun run'
if (import.meta.main) {
  runScraper();
}
