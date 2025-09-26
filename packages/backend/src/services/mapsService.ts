import {
  Client,
  type GeocodeResult,
  type Place,
  PlacesNearbyRanking,
  TravelMode,
} from "@googlemaps/google-maps-services-js";
import type { Imovel, LocationRule } from "@/types";

const googleMapsClient = new Client({});
const geocodeCache = new Map<string, GeocodeResult>();

/**
 * Converte um endereço em coordenadas geográficas (latitude/longitude).
 * Utiliza um cache em memória para evitar requisições repetidas.
 */
async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (geocodeCache.has(address)) {
    return geocodeCache.get(address)!;
  }
  try {
    const response = await googleMapsClient.geocode({
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY!,
      },
    });
    if (response.data.results.length > 0) {
      const result = response.data.results[0]!;
      geocodeCache.set(address, result);
      return result;
    }
    return null;
  } catch (error) {
    console.error(`Erro no Geocoding para o endereço: ${address}`, error);
    return null;
  }
}

/**
 * Encontra o local mais próximo de um ponto de origem, baseado em uma palavra-chave.
 */
async function findNearestPlace(
  origin: GeocodeResult,
  keyword: string,
): Promise<Place | null> {
  try {
    const response = await googleMapsClient.placesNearby({
      params: {
        location: origin.geometry.location,
        keyword,
        rankby: PlacesNearbyRanking.distance,
        key: process.env.GOOGLE_MAPS_API_KEY!,
      },
    });
    return response.data.results.length > 0 ? response.data.results[0]! : null;
  } catch (error) {
    console.error(`Erro na Places API para a keyword: ${keyword}`, error);
    return null;
  }
}

/**
 * Calcula a duração de uma viagem entre uma origem e um destino.
 * @returns A duração da viagem em minutos.
 */
async function getTravelDurationInMinutes(
  origin: GeocodeResult,
  destination: string | Place,
  mode: string,
): Promise<number | null> {
  try {
    const destinationParam =
      typeof destination === "string"
        ? destination
        : `place_id:${destination.place_id!}`;

    const response = await googleMapsClient.directions({
      params: {
        origin: origin.geometry.location,
        destination: destinationParam,
        mode: mode as TravelMode,
        key: process.env.GOOGLE_MAPS_API_KEY!,
      },
    });

    if (response.data.routes.length > 0) {
      const durationInSeconds =
        response.data.routes[0]!.legs[0]!.duration.value;
      return Math.ceil(durationInSeconds / 60);
    }
    return null; // Nenhuma rota encontrada
  } catch (error) {
    console.error(`Erro na Directions API`, error);
    return null;
  }
}

/**
 * Função principal do serviço. Verifica se um único imóvel atende a uma lista de regras de localização.
 * @param imovel - O objeto do imóvel a ser verificado.
 * @param rules - Um array de regras de localização definidas pelo usuário.
 * @returns `true` se o imóvel passar em todas as regras, `false` caso contrário.
 */
export async function doesImovelMatchLocationRules(
  imovel: Imovel,
  rules: LocationRule[],
): Promise<boolean> {
  // Se o imóvel não tiver lat/lng, não podemos verificar.

  let temCordenadas = imovel.latitude && imovel.longitude;

  if (!temCordenadas) {
    // Tenta geocodificar o endereço completo do imóvel
    const imovelAddress = `${imovel.endereco}, ${imovel.bairro}, ${imovel.cidade}`;
    const geocoded = await geocodeAddress(imovelAddress);

    if (!geocoded) {
      // Se der erro, fodeu, não tem como verificar.
      console.warn(
        `Coordenadas não encontradas para ${imovel.id}, pulando verificação.`,
      );
      return false;
    }

    // Atribui as coordenadas para uso futuro no loop
    imovel.latitude = geocoded.geometry.location.lat;
    imovel.longitude = geocoded.geometry.location.lng;
  }

  const imovelOrigin = {
    geometry: { location: { lat: imovel.latitude, lng: imovel.longitude } },
  } as GeocodeResult;

  for (const rule of rules) {
    let destination: string | Place | null = rule.target;

    if (rule.type === "generic") {
      destination = await findNearestPlace(imovelOrigin, rule.target);
      if (!destination) return false;
    }

    const duration = await getTravelDurationInMinutes(
      imovelOrigin,
      destination,
      rule.travelMode.toLowerCase(),
    );

    if (duration === null || duration > rule.maxTime) {
      return false;
    }
  }

  return true;
}
