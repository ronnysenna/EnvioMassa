/**
 * Centralized webhook URLs configuration
 */
export const WEBHOOKS = {
  // Message sending
  ENVIAR_MENSAGEM:
    process.env.WEBHOOK_URL || process.env.N8N_WEBHOOK_ENVIAR_MENSAGEM,

  // Instance management
  VERIFICAR_INSTANCIA: process.env.N8N_WEBHOOK_VERIFICAR_INSTANCIA,
  CONECTAR_INSTANCIA: process.env.N8N_WEBHOOK_CONECTAR_INSTANCIA,
  DESCONECTAR_INSTANCIA: process.env.N8N_WEBHOOK_DESCONECTAR_INSTANCIA,
  REINICIAR_INSTANCIA: process.env.N8N_WEBHOOK_REINICIAR_INSTANCIA,
} as const;

/**
 * Evolution API configuration
 */
export const EVOLUTION_API = {
  BASE_URL: process.env.EVOLUTION_API_URL,
  API_KEY: process.env.EVOLUTION_API_KEY,
} as const;

/**
 * Validates that all required webhook URLs are configured
 */
export function validateWebhookConfig(): {
  isValid: boolean;
  missing: string[];
} {
  const required = [
    "VERIFICAR_INSTANCIA",
    "CONECTAR_INSTANCIA",
    "DESCONECTAR_INSTANCIA",
    "REINICIAR_INSTANCIA",
  ] as const;

  const missing = required.filter((key) => !WEBHOOKS[key]);

  return {
    isValid: missing.length === 0,
    missing: missing.map((key) => `N8N_WEBHOOK_${key}`),
  };
}

/**
 * Gets a webhook URL with validation
 */
export function getWebhookUrl(name: keyof typeof WEBHOOKS): string {
  const url = WEBHOOKS[name];
  if (!url) {
    throw new Error(`Webhook URL not configured: N8N_WEBHOOK_${name}`);
  }
  return url;
}
