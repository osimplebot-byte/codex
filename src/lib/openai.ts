import OpenAI from 'openai';
import type { Environment } from '../config.js';

let cachedClient: OpenAI | undefined;

export function getOpenAiClient(env: Environment): OpenAI {
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey: env.openAiApiKey });
  }

  return cachedClient;
}

export interface ChatCompletionArgs {
  model?: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  maxTokens?: number;
}

export async function createChatCompletion(env: Environment, args: ChatCompletionArgs): Promise<string> {
  const client = getOpenAiClient(env);
  const response = await client.chat.completions.create({
    model: args.model ?? 'gpt-4o-mini',
    temperature: args.temperature ?? 0.3,
    max_tokens: args.maxTokens ?? 512,
    messages: args.messages,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI response did not include content');
  }

  return content.trim();
}
