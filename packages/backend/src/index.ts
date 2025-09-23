import { Hono } from "hono";
import { db } from "./db";
import { cors } from "hono/cors";
import { runScraper } from "./scraper";
import {
  Client,
  PlacesNearbyRanking,
  type GeocodeResult,
  type Place,
} from "@googlemaps/google-maps-services-js";
import cron from "node-cron";
import { gte, and, lte } from "drizzle-orm";
import { imoveis } from "./db/schema";

type TravelMode = "DRIVING" | "WALKING" | "BICYCLING";
interface LocationRule {
  type: "generic" | "specific";
  target: string;
  maxTime: number; // Em minutos
  travelMode: TravelMode;
}
interface UserPreferences {
  price: { rent: [number, number]; condo: [number, number] };
  locations: LocationRule[];
}

const app = new Hono();
const googleMapsClient = new Client({});

app.use("/api/*", cors({ origin: "http://localhost:5173" }));

// Função Helper para Geocoding (obter lat/lng de um endereço)
const geocodeAddressCache = new Map<string, GeocodeResult>();
async function getCoordsForImovel(
  imovel: typeof imoveis.$inferSelect,
): Promise<GeocodeResult | null> {
  const address = `${imovel.endereco}, ${imovel.bairro}, ${imovel.cidade}`;
  if (geocodeAddressCache.has(address)) {
    return geocodeAddressCache.get(address)!;
  }
  try {
    const response = await googleMapsClient.geocode({
      params: { address, key: process.env.GOOGLE_MAPS_API_KEY! },
    });
    if (response.data.results.length > 0) {
      const result = response.data.results[0]!;
      geocodeAddressCache.set(address, result);
      return result;
    }
    return null;
  } catch (error) {
    console.error("Erro no Geocoding:", error);
    return null;
  }
}

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

    const [minRent, maxRent] = preferences.price.rent;
    const imoveisFiltradosPorPreco = await db.query.imoveis.findMany({
      where: and(
        gte(imoveis.valor_aluguel, minRent),
        lte(imoveis.valor_aluguel, maxRent),
      ),
      orderBy: (imoveis, { desc }) => [desc(imoveis.createdAt)],
    });

    console.log(
      `Encontrados ${imoveisFiltradosPorPreco.length} imóveis após filtro de preço.`,
    );
    if (imoveisFiltradosPorPreco.length === 0) {
      return c.json({ success: true, data: [] });
    }

    const imoveisFinais = [];

    for (const imovel of imoveisFiltradosPorPreco) {
      let passouEmTodasAsRegras = true;

      const imovelCoords = await getCoordsForImovel(imovel);
      if (!imovelCoords) {
        console.warn(
          `Não foi possível obter coordenadas para o imóvel ${imovel.codigo_imovel}, pulando.`,
        );
        continue;
      }

      for (const rule of preferences.locations) {
        let destination: string | Place;

        // NOVA LÓGICA: Descobrir o destino
        if (rule.type === "specific") {
          destination = rule.target;
        } else {
          try {
            const nearbySearchResponse = await googleMapsClient.placesNearby({
              params: {
                location: imovelCoords.geometry.location,
                keyword: rule.target,
                rankby: PlacesNearbyRanking.distance,
                key: process.env.GOOGLE_MAPS_API_KEY!,
              },
            });

            if (nearbySearchResponse.data.results.length > 0) {
              destination = nearbySearchResponse.data.results[0]!;
            } else {
              console.log(
                `Nenhum '${rule.target}' encontrado perto do imóvel ${imovel.codigo_imovel}`,
              );
              passouEmTodasAsRegras = false;
              break;
            }
          } catch (e) {
            console.error(
              `Erro na Places API para o imóvel ${imovel.codigo_imovel}`,
              e,
            );
            passouEmTodasAsRegras = false;
            break;
          }
        }
        // Lógica antiga da Directions API, agora com um destino válido
        try {
          const directionsRequest = await googleMapsClient.directions({
            params: {
              origin: imovelCoords.geometry.location,
              destination: `place_id:${(destination as Place).place_id || destination}`,
              mode: rule.travelMode.toLowerCase() as any,
              key: process.env.GOOGLE_MAPS_API_KEY!,
            },
          });

          if (directionsRequest.data.routes.length > 0) {
            const durationInSeconds =
              directionsRequest.data.routes[0]!.legs[0]!.duration.value;
            const durationInMinutes = Math.ceil(durationInSeconds / 60);

            if (durationInMinutes > rule.maxTime) {
              passouEmTodasAsRegras = false;
              break;
            }
          } else {
            passouEmTodasAsRegras = false;
            break;
          }
        } catch (e) {
          console.error(
            `Erro na Directions API para o imóvel ${imovel.codigo_imovel}`,
            e,
          );
          passouEmTodasAsRegras = false;
          break;
        }
      }

      if (passouEmTodasAsRegras) {
        imoveisFinais.push(imovel);
      }
    }

    console.log(
      `Encontrados ${imoveisFinais.length} imóveis após todos os filtros.`,
    );
    return c.json({ success: true, data: imoveisFinais });
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

export default { port: 3000, fetch: app.fetch };
