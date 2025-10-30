import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

function assertEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

function getClient() {
  assertEnv();
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false
    }
  });
}

export async function getStandardPrompts(businessId, locale = 'pt-BR') {
  const client = getClient();
  const { data, error } = await client
    .from('standard_prompts')
    .select('prompt_type, content')
    .eq('business_id', businessId)
    .eq('locale', locale)
    .order('version', { ascending: false })
    .limit(3);

  if (error) {
    throw new Error(`Failed to fetch standard prompts: ${error.message}`);
  }

  return data.reduce((acc, item) => {
    if (!acc[item.prompt_type]) {
      acc[item.prompt_type] = item.content;
    }
    return acc;
  }, {});
}

export async function getCachedResponse({ businessId, locale = 'pt-BR', question }) {
  const client = getClient();
  const hash = crypto.createHash('sha256').update(question.trim().toLowerCase()).digest('hex');
  const { data, error } = await client
    .from('response_cache')
    .select('answer, metadata, expires_at')
    .eq('business_id', businessId)
    .eq('locale', locale)
    .eq('question_hash', hash)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to read cache: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    await client.from('response_cache').delete().eq('question_hash', hash);
    return null;
  }

  return { answer: data.answer, metadata: data.metadata, questionHash: hash };
}

export async function storeCachedResponse({
  businessId,
  locale = 'pt-BR',
  question,
  answer,
  ttlSeconds = 86400,
  metadata = {}
}) {
  const client = getClient();
  const questionHash = crypto.createHash('sha256').update(question.trim().toLowerCase()).digest('hex');
  const expiresAt = ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000).toISOString() : null;

  const { error } = await client.from('response_cache').upsert(
    {
      business_id: businessId,
      locale,
      question,
      question_hash: questionHash,
      answer,
      metadata,
      expires_at: expiresAt
    },
    {
      onConflict: 'business_id,locale,question_hash'
    }
  );

  if (error) {
    throw new Error(`Failed to write cache: ${error.message}`);
  }

  return { questionHash, expiresAt };
}

export function buildContext({ prompts, catalogFallback }) {
  const brandVoice = prompts.brand_voice ?? {};
  const catalog = prompts.catalog ?? {};
  const faqs = prompts.faqs ?? {};
  const hasCatalog = Array.isArray(catalog.categories) && catalog.categories.length > 0;

  return {
    system: `Você é um atendente virtual da marca. Persona: ${brandVoice.persona ?? 'Assistente prestativo'}. Tom: ${brandVoice.tone ?? 'Amigável'}.`,
    instructions: {
      greeting: brandVoice.greeting ?? 'Olá! Como posso ajudar? ',
      signature: brandVoice.signature ?? 'Equipe de atendimento'
    },
    catalog: hasCatalog ? catalog : catalogFallback,
    faqs: Array.isArray(faqs.items) ? faqs.items : []
  };
}

export async function recordSessionUsage({
  sessionId,
  businessId,
  model,
  promptTokens,
  completionTokens,
  costUsd,
  currency = 'USD',
  metadata = {}
}) {
  const client = getClient();
  const { error } = await client.from('session_usage').insert({
    session_id: sessionId,
    business_id: businessId,
    model,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    cost_usd: costUsd,
    currency,
    metadata
  });

  if (error) {
    throw new Error(`Failed to record session usage: ${error.message}`);
  }
}

export function calculateCost({ promptTokens, completionTokens, pricePer1KPrompt = 0.003, pricePer1KCompletion = 0.004 }) {
  const promptCost = (promptTokens / 1000) * pricePer1KPrompt;
  const completionCost = (completionTokens / 1000) * pricePer1KCompletion;
  return Number((promptCost + completionCost).toFixed(6));
}
