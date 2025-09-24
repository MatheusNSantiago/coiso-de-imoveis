import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const imoveis = sqliteTable("imoveis", {
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
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  latitude: real("latitude"),
  longitude: real("longitude"),
  imagens: text("imagens", { mode: "json" }),
});

export type Imovel = typeof imoveis.$inferSelect;
export type NewImovel = typeof imoveis.$inferInsert;
