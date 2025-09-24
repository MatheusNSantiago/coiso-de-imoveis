import { Browser } from "puppeteer";
import * as cheerio from "cheerio";
import type { NewImovel } from "../db/schema";

/**
 * Busca o conteúdo HTML de uma página de imóvel específica.
 * @param browser - A instância do navegador Puppeteer.
 * @param endpoint - O caminho da URL do imóvel (ex: /imovel/apartamento-...).
 * @returns O conteúdo HTML da página como string, ou null em caso de erro.
 */
async function fetchPageContent(
  browser: Browser,
  url: string,
): Promise<string | null> {
  const page = await browser.newPage();
  try {
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    return await page.content();
  } catch (error) {
    console.error(`Falha ao carregar a página: ${url}`, error);
    return null;
  } finally {
    await page.close();
  }
}

/**
 * Analisa o conteúdo HTML e extrai as coordenadas de latitude e longitude.
 * @param pageContent - O HTML da página do imóvel.
 * @returns Um objeto com latitude e longitude, ou null se não encontrar.
 */
function parseCoordinatesFromHtml(
  pageContent: string,
): { latitude: number; longitude: number } | null {
  const $ = cheerio.load(pageContent);
  let coordinates = null;

  $("script").each((_, element) => {
    const content = $(element).html();
    const has_coordinates =
      content && content.includes("latitude") && content.includes("longitude");

    if (has_coordinates) {
      const latMatch = content.match(/latitude\s*=\s*(-?\d+\.\d+);/)!;
      const lonMatch = content.match(/longitude\s*=\s*(-?\d+\.\d+);/)!;

      coordinates = {
        latitude: parseFloat(latMatch[1]!),
        longitude: parseFloat(lonMatch[1]!),
      };

      return false; // Para a iteração
    }
  });
  return coordinates;
}

/**
 * Analisa o conteúdo HTML e extrai as URLs das imagens do carrossel.
 * @param pageContent - O HTML da página do imóvel.
 * @returns Um array de strings com as URLs das imagens.
 */
function parseImageUrlsFromHtml(pageContent: string): string[] {
  const $ = cheerio.load(pageContent);
  const imageUrls = new Set<string>();

  $("#fotos-container .swiper-wrapper img").each((_, element) => {
    const imageUrl = $(element).attr("src");
    if (imageUrl) imageUrls.add(imageUrl);
  });

  return Array.from(imageUrls);
}

/**
 * Busca e extrai dados da página principal do anúncio (coordenadas e imagens).
 * @param browser A instância do navegador.
 * @param endpoint O caminho do imóvel (ex: /imovel/apartamento-...).
 * @returns Um objeto com latitude, longitude e imagens.
 */
async function fetchDetailsFromMainPage(browser: Browser, endpoint: string) {
  const mainPageUrl = "https://www.dfimoveis.com.br" + endpoint;
  const mainPageContent = await fetchPageContent(browser, mainPageUrl);

  if (!mainPageContent) {
    return { coordinates: null, imageUrls: [] };
  }
  const coordinates = parseCoordinatesFromHtml(mainPageContent);
  const imageUrls = parseImageUrlsFromHtml(mainPageContent);

  return { coordinates, imageUrls };
}

/**
 * Busca e extrai os detalhes básicos de um imóvel a partir de sua página de impressão.
 * @param browser - A instância do navegador Puppeteer.
 * @param imovelEndpoint - O caminho da URL do imóvel.
 * @returns Um objeto parcial NewImovel com os dados básicos, ou null em caso de erro.
 */
async function fetchDetailsFromContractPage(
  browser: Browser,
  imovelEndpoint: string,
): Promise<Partial<NewImovel> | null> {
  const imovelId = imovelEndpoint.split("-").pop()!;

  const printPageUrl = `https://www.dfimoveis.com.br/imovel/impressao/${imovelId}`;
  const pageContent = await fetchPageContent(browser, printPageUrl);
  if (!pageContent) return null;

  const $ = cheerio.load(pageContent);

  const getTableText = (key: string): string =>
    $(`.tlabel:contains("${key}")`).next("td").text().trim() || "";

  const parseNumericValue = (text: string): number | null => {
    const cleanedText = text
      .replace("R$", "")
      .replace(" m²", "")
      .replace(/\./g, "") // Remove todos os pontos (milhares)
      .replace(",", ".") // Troca vírgula por ponto (decimal)
      .trim();
    const value = parseFloat(cleanedText);
    return isNaN(value) ? null : value;
  };

  const getTableNumeric = (key: string): number | null =>
    parseNumericValue(getTableText(key));

  return {
    id: imovelId,
    tipo: getTableText("Tipo"),
    endereco: getTableText("Endereço"),
    bairro: getTableText("Bairro"),
    cidade: getTableText("Cidade"),
    quartos: getTableNumeric("Quartos"),
    suites: getTableNumeric("Suite"),
    vagas_garagem: getTableNumeric("Garagem"),
    area_privativa: getTableNumeric("Área Privativa"),
    valor_aluguel: getTableNumeric("Valor do Imóvel Aluguel"),
    valor_condominio: getTableNumeric("Condomínio") ?? 0,
    descricao: $("td.descricao").text().trim(),
    url: "https://www.dfimoveis.com.br" + imovelEndpoint,
  };
}

/**
 * Busca na listagem do site por novas URLs de imóveis.
 * @param browser - A instância do navegador Puppeteer.
 * @param maxPages - O número máximo de páginas da listagem a serem verificadas.
 * @returns Um array de strings com os endpoints dos imóveis encontrados.
 */
export async function fetchRecentImoveis(
  browser: Browser,
  maxPages: number = 2,
): Promise<string[]> {
  const listingUrl = `https://www.dfimoveis.com.br/aluguel/df/todos/apartamento?ordenamento=mais-recente`;
  const allEndpoints: string[] = [];

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    console.log(`Buscando URLs na página ${pageNum}...`);
    const pageUrl = `${listingUrl}&pagina=${pageNum}`;
    const pageContent = await fetchPageContent(browser, pageUrl);

    if (pageContent) {
      const $ = cheerio.load(pageContent);
      const pageEndpoints: string[] = [];
      $(".new-card").each((_, element) => {
        const href = $(element).attr("href");
        if (href) pageEndpoints.push(href);
      });

      if (pageEndpoints.length === 0) break;

      allEndpoints.push(...pageEndpoints);
    }
  }

  console.log(`Foram encontrados ${allEndpoints.length} endpoints de imóveis.`);
  return allEndpoints;
}

/**
 * Orquestra a coleta de todos os dados de um novo imóvel, seguindo o fluxo completo.
 * @param browser A instância do navegador.
 * @param endpoint O caminho do imóvel.
 * @returns Um objeto NewImovel completo pronto para ser inserido no banco.
 */
export async function scrapeImovelData(
  browser: Browser,
  endpoint: string,
): Promise<Partial<NewImovel> | null> {
  const { coordinates, imageUrls } = await fetchDetailsFromMainPage(
    browser,
    endpoint,
  );

  const basicDetails = await fetchDetailsFromContractPage(browser, endpoint);

  if (!basicDetails || !basicDetails.id) {
    console.error(
      `Falha ao obter dados básicos de ${endpoint}. O imóvel não será salvo.`,
    );
    return null;
  }

  // Combina todos os dados em um único objeto
  return {
    ...basicDetails,
    latitude: coordinates?.latitude,
    longitude: coordinates?.longitude,
    imagens: imageUrls.length > 0 ? imageUrls : undefined,
  };
}
