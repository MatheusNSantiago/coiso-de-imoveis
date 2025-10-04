import { Hono } from "hono";
import { db } from "./db";
import { cors } from "hono/cors";
import { runScraper } from "./scraper";
import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";
import { bearerAuth } from "hono/bearer-auth";
import type { User } from "@supabase/supabase-js";
import { gte, and, lte } from "drizzle-orm";
import {
  imoveis,
  preferences as preferencesTable,
  userProfiles,
} from "./db/schema";
import { doesImovelMatchLocationRules } from "./services/mapsService";
import type { UserPreferences, Imovel } from "./types";
import { sendQueuedNotifications } from "./services/notificationService";
import { sendWhatsAppMessage } from "./services/whatsappService";

const app = new Hono<{ Variables: { user: User } }>();
app.use("/api/*", cors());

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

const authMiddleware = bearerAuth({
  verifyToken: async (token, c) => {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return false;
    c.set("user", data.user);
    return true;
  },
});

app.use("/api/preferences", authMiddleware);
app.use("/api/notify-single", authMiddleware); // Proteger novo endpoint

// Endpoint para salvar preferências
app.post("/api/preferences", async (c) => {
  try {
    const user = c.get("user");
    const newPreferences = await c.req.json<
      UserPreferences & { phoneNumber?: string }
    >();
    if (!newPreferences || typeof newPreferences !== "object") {
      return c.json({ success: false, error: "Preferências inválidas" }, 400);
    }
    const { phoneNumber, ...filters } = newPreferences;
    await db
      .insert(preferencesTable)
      .values({ userId: user.id, filters })
      .onConflictDoUpdate({
        target: preferencesTable.userId,
        set: { filters, updatedAt: new Date() },
      });
    if (phoneNumber) {
      await db
        .insert(userProfiles)
        .values({ userId: user.id, phoneNumber })
        .onConflictDoUpdate({
          target: userProfiles.userId,
          set: { phoneNumber },
        });
    }
    return c.json({ success: true, message: "Preferências salvas." });
  } catch (error) {
    console.error("Erro ao salvar preferências:", error);
    return c.json({ success: false, error: "Erro interno do servidor" }, 500);
  }
});

// --- NOVO ENDPOINT PARA NOTIFICAÇÃO ÚNICA ---
app.post("/api/notify-single", async (c) => {
  try {
    const user = c.get("user");
    const { imovel } = await c.req.json<{ imovel: Imovel }>();

    if (!imovel) {
      return c.json(
        { success: false, error: "Dados do imóvel não fornecidos" },
        400,
      );
    }

    const profile = await db.query.userProfiles.findFirst({
      where: (userProfiles, { eq }) => eq(userProfiles.userId, user.id),
    });

    if (!profile?.phoneNumber) {
      return c.json(
        {
          success: false,
          error: "Número de telefone do usuário não encontrado.",
        },
        404,
      );
    }

    const message = `Olá! Segue o link para o imóvel que você se interessou:

📍 *Endereço:* ${imovel.endereco || "Não informado"}
💰 *Aluguel:* R$ ${imovel.valor_aluguel?.toLocaleString("pt-BR") || "N/A"}

Veja mais detalhes aqui:
${imovel.url}`;

    const success = await sendWhatsAppMessage(profile.phoneNumber, message);

    if (!success) {
      throw new Error("Falha ao enviar mensagem pelo serviço de WhatsApp.");
    }

    return c.json({ success: true, message: "Notificação enviada." });
  } catch (error) {
    console.error("Erro ao enviar notificação única:", error);
    return c.json({ success: false, error: "Erro interno do servidor" }, 500);
  }
});
// -------------------------------------------

// Endpoint para busca inicial de imóveis
app.get("/api/imoveis", async (c) => {
  try {
    const prefsString = c.req.query("preferences");
    if (!prefsString) {
      return c.json(
        { success: false, error: "Preferências não fornecidas" },
        400,
      );
    }
    const preferences: UserPreferences = JSON.parse(prefsString);

    const imoveisFiltrados = await db.query.imoveis.findMany({
      where: and(
        gte(imoveis.valor_aluguel, preferences.price.rent[0]),
        lte(imoveis.valor_aluguel, preferences.price.rent[1]),
        gte(imoveis.valor_condominio, preferences.price.condo[0]),
        lte(imoveis.valor_condominio, preferences.price.condo[1]),
        gte(imoveis.quartos, preferences.bedrooms),
        gte(imoveis.vagas_garagem, preferences.parkingSpots),
      ),
      orderBy: (imoveis, { desc }) => [desc(imoveis.createdAt)],
    });

    const imoveisCompativeis = [];
    for (const imovel of imoveisFiltrados) {
      const matchResult = await doesImovelMatchLocationRules(
        imovel,
        preferences.locations,
      );
      if (matchResult?.isMatch) {
        imoveisCompativeis.push({
          ...imovel,
          matchedRules: matchResult.matchedRules,
        });
      }
    }
    return c.json({ success: true, data: imoveisCompativeis });
  } catch (error) {
    console.error("Erro ao processar a busca de imóveis:", error);
    return c.json({ success: false, error: "Erro interno do servidor" }, 500);
  }
});

// Endpoint para acionar scraper
app.post("/api/scraper/run", async (c) => {
  runScraper().catch((err) =>
    console.error("Erro ao executar o scraper manualmente:", err),
  );
  return c.json({
    success: true,
    message: "Scraper iniciado em segundo plano.",
  });
});

// Agendamentos
cron.schedule(
  "0 8,18 * * *",
  () =>
    runScraper().catch((err) =>
      console.error("Erro na execução agendada do scraper:", err),
    ),
  { timezone: "America/Sao_Paulo" },
);
cron.schedule(
  "*/2 * * * *",
  () =>
    sendQueuedNotifications().catch((err) =>
      console.error("Erro na execução agendada do notificador:", err),
    ),
  { timezone: "America/Sao_Paulo" },
);

export default {
  port: process.env.PORT || 3000,
  hostname: "0.0.0.0",
  fetch: app.fetch,
  idleTimeout: 90,
};
