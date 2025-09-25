import type { imoveis } from "../db/schema";

// Tipos relacionados ao nosso banco de dados
export type Imovel = typeof imoveis.$inferSelect;
export type NewImovel = typeof imoveis.$inferInsert;

// Tipos relacionados às preferências do usuário e regras da API
export type TravelMode = "DRIVING" | "WALKING" | "BICYCLING";

export interface LocationRule {
  type: "generic" | "specific";
  target: string;
  maxTime: number; // Em minutos
  travelMode: TravelMode;
}

export interface UserPreferences {
  price: { rent: [number, number]; condo: [number, number] };
  locations: LocationRule[];
}
