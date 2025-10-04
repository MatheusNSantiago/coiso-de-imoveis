import {
  pgTable,
  uuid,
  timestamp,
  pgEnum,
  uniqueIndex,
  text,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { imoveis } from "./imoveis";
import { userProfiles } from "./userProfiles";
import { relations } from "drizzle-orm";

// Enum para o status da notificação
export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
]);

// Definição da tabela
export const notificationsQueue = pgTable(
  "notifications_queue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    imovelId: text("imovel_id") // Deve ser text para corresponder ao ID do imóvel
      .notNull()
      .references(() => imoveis.id, { onDelete: "cascade" }),
    status: notificationStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({ // Mudança para objeto para múltiplos índices/constraints
    userImovelUnique: uniqueIndex("user_imovel_unique_idx").on(
      table.userId,
      table.imovelId,
    ),
  }),
);

// --- BLOCO CORRIGIDO E COMPLETO DE RELAÇÕES ---
export const notificationsQueueRelations = relations(
  notificationsQueue,
  ({ one }) => ({
    // Relação com a tabela de usuários (base do Supabase Auth)
    user: one(users, {
      fields: [notificationsQueue.userId],
      references: [users.id],
    }),
    // Relação com a tabela de imóveis
    imovel: one(imoveis, {
      fields: [notificationsQueue.imovelId],
      references: [imoveis.id],
    }),
    // Relação com a tabela de perfis de usuário (onde está o telefone)
    userProfile: one(userProfiles, {
      fields: [notificationsQueue.userId],
      references: [userProfiles.userId],
    }),
  }),
);
