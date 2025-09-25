import {
  text,
  integer,
  real,
  pgTable,
  timestamp,
  json,
  serial,
  varchar,
} from "drizzle-orm/pg-core";

export const imoveis = pgTable("imoveis", {
  id: serial("id").primaryKey(),
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
});

export type Imovel = typeof imoveis.$inferSelect;
export type NewImovel = typeof imoveis.$inferInsert;
