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

async function extractBasicInfo(
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

    const getTableNumericValue = (key: string): number => {
      const textValue = getTableTextValue(key)
        .replace("R$", "")
        .replace(" m²", "")
        .replace(".", "")
        .replace(",", ".")
        .trim();

      return parseFloat(textValue);
    };

    console.log(`Sucesso ao extrair dados do ID ${imovelId}.`);
    return {
      codigo_imovel: getTableTextValue("Cód. Imóvel"),
      tipo: getTableTextValue("Tipo"),
      endereco: getTableTextValue("Endereço"),
      bairro: getTableTextValue("Bairro"),
      cidade: getTableTextValue("Cidade"),
      quartos: getTableNumericValue("Quartos"),
      suites: getTableNumericValue("Suite"),
      vagas_garagem: getTableNumericValue("Garagem"),
      area_privativa: getTableNumericValue("Área Privativa"),
      valor_aluguel: getTableNumericValue("Valor do Imóvel Aluguel"),
      valor_condominio: getTableNumericValue("Condomínio"),
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

interface Coordinates {
  latitude: number;
  longitude: number;
}

async function extractCoordinate(
  browser: Browser,
  endPoint: string,
): Promise<Coordinates | null> {
  const urlImovel = `https://www.dfimoveis.com.br/${endPoint}`;

  const page = await browser.newPage();

  try {
    await page.goto(urlImovel, { waitUntil: "networkidle2" });
    const content = await page.content();
    const $ = cheerio.load(content);

    let latitude: number | null = null;
    let longitude: number | null = null;

    $("script").each((_, element) => {
      const content = $(element).html();

      // Verificamos se o conteúdo do script não é nulo e contém as palavras-chave
      const has_coordinates =
        content &&
        content.includes("latitude") &&
        content.includes("longitude");

      if (has_coordinates) {
        const latMatch = content.match(/latitude\s*=\s*(-?\d+\.\d+);/)!;
        const lonMatch = content.match(/longitude\s*=\s*(-?\d+\.\d+);/)!;

        latitude = parseFloat(latMatch[1]!);
        longitude = parseFloat(lonMatch[1]!);

        // para a iteração .each()
        return false;
      }
    });

    if (latitude!! && longitude!!) return { latitude, longitude };
    return null;
  } catch (error) {
    console.error(`Erro ao extrair coordenadas de ${urlImovel}:`, error);
    return null;
  } finally {
    await page.close();
  }
}

async function extractImageUrls(browser: Browser, endPoint: string) {
  const urlImovel = `https://www.dfimoveis.com.br/${endPoint}`;

  const page = await browser.newPage();
  await page.goto(urlImovel, { waitUntil: "networkidle2" });

  const content = await page.content();

  const $ = cheerio.load(content);

  const imageUrls = new Set<string>();
  $("#fotos-container .swiper-wrapper img").each((_, element) => {
    const imageUrl = $(element).attr("src");
    if (imageUrl) imageUrls.add(imageUrl);
  });

  await page.close();

  if (imageUrls.size == 0) return [];

  console.log(`Encontradas ${imageUrls.size} imagens únicas.`);
  return Array.from(imageUrls);
}

export async function runScraper() {
  console.log("Iniciando o scraper...");
  let browser = await puppeteer.connect({
    browserWSEndpoint: "ws://127.0.0.1:9222",
  });

  // const urls_imoveis = await getUrlsImoveisListados(browser);
  const urls_imoveis = [
    "/imovel/apartamento-2-quartos-aluguel-lago-norte-brasilia-df-ca-11-1204636",
  ];
  let novosImoveisAdicionados = 0;

  for (const url of urls_imoveis) {
    const coordinate = await extractCoordinate(browser, url);
    const imageUrls = await extractImageUrls(browser, url);

    const basicInfo = await extractBasicInfo(browser, url);
    if (!basicInfo) continue;

    try {
      const isImovelOnDB = await db.query.imoveis.findFirst({
        where: eq(imoveis.codigo_imovel, basicInfo.codigo_imovel),
      });

      // Se já existir, quer dizer que já vimos todos os novos e podemos parar o scraper
      if (isImovelOnDB) break;

      await db.insert(imoveis).values(basicInfo);
      console.log(
        `=> Novo imóvel adicionado: ${basicInfo.codigo_imovel} - ${basicInfo.endereco}`,
      );
      novosImoveisAdicionados++;
    } catch (dbError) {
      console.error(
        `Erro ao interagir com o banco de dados para o código ${basicInfo.codigo_imovel}:`,
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
