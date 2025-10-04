import axios from "axios";

// Esta variável será lida do ambiente do Railway que você configurou
const WHATSAPP_BRIDGE_URL = process.env.WHATSAPP_BRIDGE_URL;

if (!WHATSAPP_BRIDGE_URL) {
  console.warn(
    "A variável de ambiente WHATSAPP_BRIDGE_URL não está configurada. O envio de mensagens via WhatsApp está desabilitado.",
  );
}

/**
 * Envia uma mensagem de texto simples para um número de telefone via whatsapp-bridge.
 * @param to O número do destinatário (ex: 5561999998888)
 * @param message O conteúdo da mensagem de texto.
 * @returns {Promise<boolean>} Retorna true se a mensagem foi enviada com sucesso, false caso contrário.
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string,
): Promise<boolean> {
  if (!WHATSAPP_BRIDGE_URL) {
    return false;
  }

  // A API do nosso bridge Go espera um POST em /api/send
  const url = `${WHATSAPP_BRIDGE_URL}/api/send`;

  const payload = {
    recipient: to, // O backend Go espera o campo 'recipient'
    message: message, // O backend Go espera o campo 'message'
  };

  try {
    const response = await axios.post(url, payload, { timeout: 15000 }); // Adicionado timeout

    if (response.data?.success) {
      console.log(`Mensagem enviada com sucesso para ${to} via bridge.`);
      return true;
    } else {
      console.error(
        `Bridge retornou falha ao tentar enviar para ${to}:`,
        response.data?.message || "Erro desconhecido retornado pela bridge.",
      );
      return false;
    }
  } catch (error: any) {
    console.error(
      `Falha de comunicação com o WhatsApp Bridge ao tentar enviar para ${to}:`,
      error.response?.data || error.message,
    );
    return false;
  }
}
