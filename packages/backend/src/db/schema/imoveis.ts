import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const imoveis = sqliteTable("imoveis", {
  codigo_imovel: text("codigo_imovel").primaryKey(),
  tipo: text("tipo"),
  endereco: text("endereco"),
  bairro: text("bairro"),
  cidade: text("cidade"),
  quartos: text("quartos"),
  suites: text("suites"),
  vagas_garagem: text("vagas_garagem"),
  area_privativa: text("area_privativa"),
  valor_aluguel: text("valor_aluguel"),
  valor_condominio: text("valor_condominio"),
  descricao: text("descricao"),
  url: text("url").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Imovel = typeof imoveis.$inferSelect;
export type NewImovel = typeof imoveis.$inferInsert;
