import { z } from 'zod';
import type { Environment } from '../config.js';
import { createChatCompletion } from '../lib/openai.js';
import {
  fetchConversationHistory,
  fetchCustomerProfile,
  storeConversationTurns,
  type ConversationTurn,
} from '../lib/supabase.js';
import { sendEvolutionMessage, type EvolutionWebhookPayload } from '../lib/evolution.js';
import { generateTurnId, newConversationId, nowIso } from '../lib/utils.js';

const webhookSchema = z.object({
  instanceId: z.string(),
  messageId: z.string(),
  from: z.string(),
  to: z.string(),
  text: z.string(),
  timestamp: z.number(),
  metadata: z.record(z.unknown()).optional(),
});

export type WhatsAppWebhookInput = z.infer<typeof webhookSchema>;

interface ContextMetadata {
  customerId: string;
  conversationId: string;
}

function extractContext(payload: EvolutionWebhookPayload): ContextMetadata {
  const customerId = (payload.metadata?.customerId as string | undefined) ?? payload.to;
  const conversationId =
    (payload.metadata?.conversationId as string | undefined) ?? newConversationId();

  return { customerId, conversationId };
}

export async function runWhatsAppBridgeWorkflow(env: Environment, rawPayload: unknown): Promise<string> {
  const payload = webhookSchema.parse(rawPayload) as EvolutionWebhookPayload;
  const { customerId, conversationId } = extractContext(payload);

  const profile = await fetchCustomerProfile(env, customerId);
  if (!profile) {
    throw new Error(`Customer profile ${customerId} not found`);
  }

  const history = await fetchConversationHistory(env, customerId, 'whatsapp');
  const systemPrompt = buildWhatsAppSystemPrompt(profile);

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  for (const turn of history) {
    messages.push({ role: turn.role, content: turn.content });
  }

  messages.push({ role: 'user', content: payload.text });

  const completion = await createChatCompletion(env, {
    messages,
    temperature: 0.4,
  });

  const timestamp = new Date(payload.timestamp * 1000).toISOString();
  const turns: ConversationTurn[] = [
    {
      id: generateTurnId('wa-user'),
      customerId,
      channel: 'whatsapp',
      role: 'user',
      content: payload.text,
      createdAt: timestamp,
      metadata: { conversationId, messageId: payload.messageId, from: payload.from },
    },
    {
      id: generateTurnId('wa-assistant'),
      customerId,
      channel: 'whatsapp',
      role: 'assistant',
      content: completion,
      createdAt: nowIso(),
      metadata: { conversationId },
    },
  ];

  await storeConversationTurns(env, turns);
  await sendEvolutionMessage(env, {
    to: payload.from,
    message: completion,
    replyToMessageId: payload.messageId,
  });

  return completion;
}

function buildWhatsAppSystemPrompt(profile: Awaited<ReturnType<typeof fetchCustomerProfile>>): string {
  const lines = [
    'Você está atendendo clientes pelo WhatsApp Business em português.',
    `Apresente-se como representante de ${profile?.companyName ?? 'nossa empresa'}.`,
    'Responda com mensagens curtas, amigáveis e com instruções claras.',
  ];

  if (profile?.voiceTone) {
    lines.push(`Tom de voz: ${profile.voiceTone}.`);
  }
  if (profile?.openingHours) {
    lines.push(`Horário de atendimento: ${profile.openingHours}.`);
  }
  if (profile?.products?.length) {
    lines.push(`Produtos/serviços disponíveis: ${profile.products.join(', ')}.`);
  }
  if (profile?.faqs?.length) {
    lines.push('Base de conhecimento resumida:');
    for (const faq of profile.faqs) {
      lines.push(`Pergunta: ${faq.question}\nResposta: ${faq.answer}`);
    }
  }

  return lines.join('\n');
}
