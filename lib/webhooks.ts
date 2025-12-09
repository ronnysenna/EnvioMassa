/**
 * Centralized webhook URLs configuration (DEFAULTS)
 * Esses são webhooks padrão usados apenas se o usuário não configurar os seus
 */
export const WEBHOOKS = {
  // Message sending
  ENVIAR_MENSAGEM:
    process.env.WEBHOOK_URL || process.env.N8N_WEBHOOK_ENVIAR_MENSAGEM,

  // Instance management
  CRIAR_INSTANCIA: process.env.N8N_WEBHOOK_CRIAR_INSTANCIA,
  VERIFICAR_INSTANCIA: process.env.N8N_WEBHOOK_VERIFICAR_INSTANCIA,
  CONECTAR_INSTANCIA: process.env.N8N_WEBHOOK_CONECTAR_INSTANCIA,
  DESCONECTAR_INSTANCIA: process.env.N8N_WEBHOOK_DESCONECTAR_INSTANCIA,
  DELETAR_INSTANCIA: process.env.N8N_WEBHOOK_DELETAR_INSTANCIA,
} as const;

/**
 * Evolution API configuration
 */
export const EVOLUTION_API = {
  BASE_URL: process.env.EVOLUTION_API_URL,
  API_KEY: process.env.EVOLUTION_API_KEY,
} as const;

/**
 * Mapeia tipos de webhook para campos do usuário
 */
const webhookFieldMap: Record<keyof typeof WEBHOOKS, keyof UserWebhooks> = {
  ENVIAR_MENSAGEM: "webhookSendMessage",
  CRIAR_INSTANCIA: "webhookCreateInstance",
  VERIFICAR_INSTANCIA: "webhookVerifyInstance",
  CONECTAR_INSTANCIA: "webhookConnectInstance",
  DESCONECTAR_INSTANCIA: "webhookDeleteInstance",
  DELETAR_INSTANCIA: "webhookDeleteInstance",
};

/**
 * Interface para tipos de webhooks do usuário
 */
export interface UserWebhooks {
  webhookSendMessage: string | null;
  webhookCreateInstance: string | null;
  webhookVerifyInstance: string | null;
  webhookConnectInstance: string | null;
  webhookDeleteInstance: string | null;
}

/**
 * Validates that all required webhook URLs are configured
 */
export function validateWebhookConfig(): {
  isValid: boolean;
  missing: string[];
} {
  const required = [
    "CRIAR_INSTANCIA",
    "VERIFICAR_INSTANCIA",
    "CONECTAR_INSTANCIA",
    "DESCONECTAR_INSTANCIA",
    "DELETAR_INSTANCIA",
  ] as const;

  const missing = required.filter((key) => !WEBHOOKS[key]);

  return {
    isValid: missing.length === 0,
    missing: missing.map((key) => `N8N_WEBHOOK_${key}`),
  };
}

/**
 * Gets a webhook URL com suporte a webhooks customizados do usuário
 * Webhooks customizados são OBRIGATÓRIOS
 */
export function getWebhookUrl(
  name: keyof typeof WEBHOOKS,
  userWebhooks?: UserWebhooks | null
): string {
  // Se temos webhooks customizados do usuário, usar
  if (userWebhooks) {
    const fieldKey = webhookFieldMap[name];
    const userWebhook = userWebhooks[fieldKey];
    if (userWebhook) {
      return userWebhook;
    }
  }

  // Se chegou aqui e é webhook de envio, erro obrigatório
  if (name === "ENVIAR_MENSAGEM") {
    throw new Error(
      "Webhook de envio de mensagens é obrigatório. Configure em Webhooks nas configurações."
    );
  }

  // Para outros webhooks, fallback para padrão (não usados em settings, apenas internos)
  const defaultWebhook = WEBHOOKS[name];
  if (!defaultWebhook) {
    throw new Error(`Webhook URL not configured: N8N_WEBHOOK_${name}`);
  }
  return defaultWebhook;
}
