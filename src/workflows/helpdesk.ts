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
import { notifyHelpdeskWhatsApp, sendHelpdeskEmail } from '../lib/notifications.js';

const helpdeskInputSchema = z.object({
  customerId: z.string().uuid(),
  message: z.string().min(1),
  requester: z.string().optional(),
  channel: z.enum(['web', 'whatsapp', 'email']).default('web'),
});

export type HelpdeskInput = z.infer<typeof helpdeskInputSchema>;

export interface HelpdeskResult {
  response: string;
  escalatedToHuman: boolean;
}

export async function runHelpdeskWorkflow(env: Environment, rawInput: unknown): Promise<HelpdeskResult> {
  const input = helpdeskInputSchema.parse(rawInput);
  const profile = await fetchCustomerProfile(env, input.customerId);

  if (!profile) {
    throw new Error(`Customer profile ${input.customerId} not found`);
  }

  const history = await fetchConversationHistory(env, input.customerId, 'helpdesk');

  const systemPrompt = buildHelpdeskSystemPrompt(profile);
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  for (const turn of history) {
    messages.push({ role: turn.role, content: turn.content });
  }

  messages.push({
    role: 'user',
    content: `Canal: ${input.channel}. Solicitante: ${input.requester ?? 'desconhecido'}. Mensagem: ${input.message}`,
  });

  const completion = await createChatCompletion(env, {
    messages,
    temperature: 0.2,
  });

  const { response, escalate } = parseHelpdeskResponse(completion);

  const now = nowIso();
  const turns: ConversationTurn[] = [
    {
      id: generateTurnId('helpdesk-user'),
      customerId: input.customerId,
      channel: 'helpdesk',
      role: 'user',
      content: input.message,
      createdAt: now,
      metadata: { channel: input.channel, requester: input.requester },
    },
    {
      id: generateTurnId('helpdesk-assistant'),
      customerId: input.customerId,
      channel: 'helpdesk',
      role: 'assistant',
      content: response,
      createdAt: nowIso(),
      metadata: { escalate },
    },
  ];

  await storeConversationTurns(env, turns);

  if (escalate) {
    const subject = `Escalação Helpdesk - ${profile.companyName}`;
    const body = [
      `Cliente: ${profile.companyName} (${input.customerId})`,
      `Canal: ${input.channel}`,
      `Solicitante: ${input.requester ?? 'desconhecido'}`,
      `Mensagem original: ${input.message}`,
      `Resposta sugerida pela IA: ${response}`,
    ].join('\n');

    await Promise.all([
      sendHelpdeskEmail(env, subject, body),
      notifyHelpdeskWhatsApp(env, `${subject}\n${body}`),
    ]);
  }

  return {
    response,
    escalatedToHuman: escalate,
  };
}

function buildHelpdeskSystemPrompt(profile: Awaited<ReturnType<typeof fetchCustomerProfile>>): string {
  const lines = [
    'Você é um agente de suporte interno que auxilia clientes a usar o painel da plataforma.',
    'Sempre responda em português brasileiro.',
    'Forneça instruções passo a passo sempre que possível.',
    'Analise se a solicitação precisa ser escalada para um humano. Se houver risco financeiro, reclamações graves ou solicitação fora do escopo padrão, marque para escalar.',
    'Responda exclusivamente em JSON com as chaves `response` (string) e `escalate` (boolean).',
    `Cliente atual: ${profile?.companyName ?? 'desconhecido'}.`,
  ];

  if (profile?.voiceTone) {
    lines.push(`Utilize o tom de voz: ${profile.voiceTone}.`);
  }

  return lines.join('\n');
}

function parseHelpdeskResponse(completion: string): { response: string; escalate: boolean } {
  try {
    const parsed = JSON.parse(completion) as { response?: string; escalate?: boolean };
    if (!parsed.response) {
      throw new Error('Missing response');
    }
    return {
      response: parsed.response,
      escalate: Boolean(parsed.escalate),
    };
  } catch (error) {
    return {
      response: completion,
      escalate: false,
    };
  }
}
