import {
  text,
  integer,
  real,
  pgTable,
  timestamp,
  json,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core";

export const imoveis = pgTable("imoveis", {
  id: text("id").primaryKey(),
  tipo: varchar("tipo", { length: 50 }),
  endereco: text("endereco"),
  bairro: text("bairro"),
  cidade: text("cidade"),
  quartos: integer("quartos"),
  suites: integer("suites"),
  vagas_garagem: integer("vagas_garagem"),
  area_privativa: real("area_privativa"),
  valor_aluguel: real("valor_aluguel"),
  valor_condominio: real("valor_condominio"),
  descricao: text("descricao"),
  url: varchar("url", { length: 150 }).notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  imagens: json("imagens"),
  amenities: jsonb("amenities").$type<string[]>(),
});

export type Imovel = typeof imoveis.$inferSelect;
export type NewImovel = typeof imoveis.$inferInsert;
