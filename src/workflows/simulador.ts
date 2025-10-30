import { z } from 'zod';
import type { Environment } from '../config.js';
import { createChatCompletion } from '../lib/openai.js';
import {
  fetchConversationHistory,
  fetchCustomerProfile,
  storeConversationTurns,
  type ConversationTurn,
} from '../lib/supabase.js';
import { generateTurnId, nowIso } from '../lib/utils.js';

const simulatorInputSchema = z.object({
  customerId: z.string().uuid(),
  message: z.string().min(1),
  conversationId: z.string().uuid(),
});

export type SimulatorInput = z.infer<typeof simulatorInputSchema>;

export interface SimulatorResult {
  response: string;
  customerId: string;
  conversationId: string;
}

export async function runSimulatorWorkflow(env: Environment, rawInput: unknown): Promise<SimulatorResult> {
  const input = simulatorInputSchema.parse(rawInput);
  const profile = await fetchCustomerProfile(env, input.customerId);

  if (!profile) {
    throw new Error(`Customer profile ${input.customerId} not found`);
  }

  const history = await fetchConversationHistory(env, input.customerId, 'simulator');

  const systemPrompt = buildSimulatorSystemPrompt(profile);
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  for (const turn of history) {
    messages.push({ role: turn.role, content: turn.content });
  }

  messages.push({ role: 'user', content: input.message });

  const completion = await createChatCompletion(env, {
    messages,
  });

  const now = nowIso();
  const turns: ConversationTurn[] = [
    {
      id: generateTurnId('sim-user'),
      customerId: input.customerId,
      channel: 'simulator',
      role: 'user',
      content: input.message,
      createdAt: now,
      metadata: { conversationId: input.conversationId },
    },
    {
      id: generateTurnId('sim-assistant'),
      customerId: input.customerId,
      channel: 'simulator',
      role: 'assistant',
      content: completion,
      createdAt: nowIso(),
      metadata: { conversationId: input.conversationId },
    },
  ];

  await storeConversationTurns(env, turns);

  return {
    response: completion,
    customerId: input.customerId,
    conversationId: input.conversationId,
  };
}

function buildSimulatorSystemPrompt(profile: Awaited<ReturnType<typeof fetchCustomerProfile>>): string {
  const lines = [
    `Você é um atendente virtual representando ${profile?.companyName ?? 'a empresa do cliente'}.`,
    'Siga o tom de voz definido pelo cliente e responda de maneira útil e concisa.',
  ];

  if (profile?.voiceTone) {
    lines.push(`Tom de voz desejado: ${profile.voiceTone}.`);
  }
  if (profile?.openingHours) {
    lines.push(`Horário de funcionamento: ${profile.openingHours}.`);
  }
  if (profile?.products?.length) {
    lines.push(`Produtos/serviços: ${profile.products.join(', ')}.`);
  }
  if (profile?.faqs?.length) {
    lines.push('FAQs conhecidas:');
    for (const faq of profile.faqs) {
      lines.push(`Q: ${faq.question}\nA: ${faq.answer}`);
    }
  }

  return lines.join('\n');
}
