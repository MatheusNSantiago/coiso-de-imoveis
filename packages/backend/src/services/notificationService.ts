import { db } from "@/db";
import { notificationsQueue } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendWhatsAppMessage } from "./whatsappService";

export async function sendQueuedNotifications() {
  console.log("Notificador: Verificando fila de notificações...");

  const pendingNotifications = await db.query.notificationsQueue.findMany({
    where: eq(notificationsQueue.status, "pending"),
    with: {
      userProfile: true,
      imovel: true,
    },
    limit: 10,
  });

  if (pendingNotifications.length === 0) {
    console.log("Notificador: Nenhuma notificação pendente encontrada.");
    return;
  }

  console.log(
    `Notificador: ${pendingNotifications.length} notificações para enviar.`,
  );

  for (const notification of pendingNotifications) {
    if (!notification.userProfile?.phoneNumber || !notification.imovel) {
      console.error(
        `Dados incompletos para a notificação ${notification.id}. Marcando como falha.`,
      );
      await db
        .update(notificationsQueue)
        .set({ status: "failed" })
        .where(eq(notificationsQueue.id, notification.id));
      continue;
    }

    const { imovel, userProfile } = notification;

    // --- FORMATAÇÃO DA MENSAGEM ---
    // Agora podemos usar formatação como negrito (*), itálico (_), etc.
    const message = `🎉 *Vigía Imóveis Encontrou!* 🎉

Um novo imóvel que corresponde à sua busca acabou de ser anunciado:

📍 *Endereço:* ${imovel.endereco || "Não informado"}
💰 *Aluguel:* R$ ${imovel.valor_aluguel?.toLocaleString("pt-BR") || "N/A"}
🏢 *Condomínio:* R$ ${imovel.valor_condominio?.toLocaleString("pt-BR") || "N/A"}

Clique aqui para ver todos os detalhes e fotos:
${imovel.url}`;
    // --------------------------------

    // Usa a nova função de envio
    const success = await sendWhatsAppMessage(
      "5561984128814",
      message,
    );

    // Atualiza o status da notificação no banco
    await db
      .update(notificationsQueue)
      .set({ status: success ? "sent" : "failed" })
      .where(eq(notificationsQueue.id, notification.id));
  }
}
