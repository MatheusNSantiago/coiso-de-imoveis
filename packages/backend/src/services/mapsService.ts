import {
  Client,
  type GeocodeResult,
  type Place,
  PlacesNearbyRanking,
  TravelMode,
} from "@googlemaps/google-maps-services-js";
import type { Imovel, LocationRule, MatchedRuleResult } from "@/types";

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
  rule: LocationRule,
): Promise<number | null> {
  try {
    const destinationParam =
      typeof destination === "string"
        ? destination
        : `place_id:${destination.place_id!}`;

    let has_departure_time =
      rule.travelMode === "DRIVING" && rule.departureTime;

    const response = await googleMapsClient.directions({
      params: {
        origin: origin.geometry.location,
        destination: destinationParam,
        key: process.env.GOOGLE_MAPS_API_KEY!,
        mode: rule.travelMode.toLowerCase() as TravelMode,
        departure_time: has_departure_time
          ? getNextDepartureTime(rule.departureTime!)
          : undefined,
      },
    });

    if (response.data.routes.length > 0) {
      // Usa duration_in_traffic se disponível (para rotas com departure_time), senão o duration normal
      const durationInSeconds =
        response.data.routes[0]!.legs[0]!.duration_in_traffic?.value ??
        response.data.routes[0]!.legs[0]!.duration.value;

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
 * Calcula o próximo timestamp de partida com base em uma string de horário "HH:mm".
 */
const getNextDepartureTime = (timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const departureDate = new Date();

  departureDate.setHours(hours!, minutes, 0, 0);

  // Se o horário já passou hoje, agenda para o próximo dia
  if (departureDate < new Date()) {
    departureDate.setDate(departureDate.getDate() + 1);
  }

  // Se o próximo dia for fim de semana, avança para segunda-feira
  if (departureDate.getDay() === 6) {
    // Sábado
    departureDate.setDate(departureDate.getDate() + 2);
  } else if (departureDate.getDay() === 0) {
    // Domingo
    departureDate.setDate(departureDate.getDate() + 1);
  }

  return departureDate;
};

/**
 * Função principal do serviço. Verifica se um único imóvel atende a uma lista de regras de localização.
 * @param imovel - O objeto do imóvel a ser verificado.
 * @param rules - Um array de regras de localização definidas pelo usuário.
 */
export async function doesImovelMatchLocationRules(
  imovel: Partial<Imovel>,
  rules: LocationRule[],
) {
  if (!rules || rules.length === 0) {
    return { isMatch: true, matchedRules: [] };
  }

  let hasCoordinates = imovel.latitude && imovel.longitude;

  // Garante que o imóvel tenha coordenadas, buscando-as se necessário.
  if (!hasCoordinates) {
    // Tenta geocodificar o endereço completo do imóvel
    const imovelAddress = `${imovel.endereco}, ${imovel.bairro}, ${imovel.cidade}`;
    const geocoded = await geocodeAddress(imovelAddress);

    if (!geocoded) {
      // Se der erro, fodeu, não tem como verificar.
      console.warn(
        `Coordenadas não encontradas para ${imovel.id}, pulando verificação.`,
      );
      return;
    }

    // Atribui as coordenadas para uso futuro no loop
    imovel.latitude = geocoded.geometry.location.lat;
    imovel.longitude = geocoded.geometry.location.lng;
  }

  const imovelOrigin = {
    geometry: { location: { lat: imovel.latitude, lng: imovel.longitude } },
  } as GeocodeResult;

  let allRulesPass = true;
  const matchedRules: MatchedRuleResult[] = [];

  // 2. Itera sobre cada regra para verificar a compatibilidade.
  for (const rule of rules) {
    let destination: string | Place | null = rule.target;

    // Se for uma regra genérica (ex: "Academia"), encontra o local mais próximo primeiro.
    if (rule.type === "generic") {
      destination = await findNearestPlace(imovelOrigin, rule.target);
      if (!destination) {
        console.log(
          `Nenhum(a) "${rule.target}" encontrado perto do imóvel ${imovel.id}.`,
        );
        allRulesPass = false;
        continue; // Pula para a próxima regra, pois esta já falhou.
      }
    }

    // 3. Calcula a duração da viagem para a regra atual.
    const duration = await getTravelDurationInMinutes(
      imovelOrigin,
      destination,
      rule, // Passa a regra inteira
    );

    // 4. Verifica se a regra foi atendida.
    if (duration === null || duration > rule.maxTime) {
      allRulesPass = false;
    }

    // 5. Adiciona o resultado ao array, mesmo que tenha falhado, para ser exibido no frontend.
    if (duration !== null) {
      matchedRules.push({ rule, actualDuration: duration });
    } else {
      // Se a duração for nula (erro na API ou rota não encontrada), a regra falha.
      allRulesPass = false;
    }
  }

  return { isMatch: allRulesPass, matchedRules };
}
