// packages/backend/src/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { imoveis, preferences, users } from "./schema";

const connectionString = process.env.DATABASE_URL!;

export const client = postgres(connectionString, { prepare: false });

export const db = drizzle({
  connection: connectionString,
  schema: { imoveis, preferences, users },
});
