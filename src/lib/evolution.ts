import type { Environment } from '../config.js';

export interface EvolutionWebhookPayload {
  instanceId: string;
  messageId: string;
  from: string;
  to: string;
  text: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface EvolutionSendMessagePayload {
  to: string;
  message: string;
  replyToMessageId?: string;
}

export async function sendEvolutionMessage(
  env: Environment,
  payload: EvolutionSendMessagePayload,
): Promise<void> {
  const response = await fetch(`${env.evolutionApiUrl}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.evolutionApiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Evolution API error: ${response.status} ${body}`);
  }
}
