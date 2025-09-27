import type { imoveis } from "../db/schema";

// Tipos relacionados ao nosso banco de dados
export type Imovel = typeof imoveis.$inferSelect;
export type NewImovel = typeof imoveis.$inferInsert;

// Tipos relacionados às preferências do usuário e regras da API
export type TravelMode = "DRIVING" | "WALKING" | "BICYCLING";

export interface LocationRule {
  id: string;
  type: "generic" | "specific";
  target: string;
  maxTime: number; // Em minutos
  travelMode: TravelMode;
  departureTime?: string;

}

// Novo tipo para retornar os resultados das regras
export interface MatchedRuleResult {
  rule: LocationRule;
  actualDuration: number; // O tempo real calculado
}

export interface UserPreferences {
  bedrooms: number;
  bathrooms: number;
  parkingSpots: number;
  amenities: string[];
  price: { rent: [number, number]; condo: [number, number] };
  locations: LocationRule[];
}
