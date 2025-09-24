import {
  text,
  integer,
  real,
  pgTable,
  timestamp,
  json,
} from "drizzle-orm/pg-core";

export const imoveis = pgTable("imoveis", {
  id: text("id").primaryKey(),
  tipo: text("tipo"),
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
  url: text("url").notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  imagens: json("imagens"),
});

export type Imovel = typeof imoveis.$inferSelect;
export type NewImovel = typeof imoveis.$inferInsert;
