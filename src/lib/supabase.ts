import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Environment } from '../config.js';

export interface CustomerProfile {
  id: string;
  companyName: string;
  description?: string;
  segment?: string;
  voiceTone?: string;
  openingHours?: string;
  products?: string[];
  faqs?: Array<{ question: string; answer: string }>;
  whatsappNumber?: string;
  onboardingCompletedAt?: string;
}

export interface ConversationTurn {
  id: string;
  customerId: string;
  channel: 'simulator' | 'whatsapp' | 'helpdesk';
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

let cachedClient: SupabaseClient | undefined;

export function getSupabaseClient(env: Environment): SupabaseClient {
  if (!cachedClient) {
    cachedClient = createClient(env.supabaseUrl, env.supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  return cachedClient;
}

export async function upsertCustomerProfile(env: Environment, profile: CustomerProfile): Promise<void> {
  const client = getSupabaseClient(env);
  const { error } = await client.from('customer_profiles').upsert(profile, {
    onConflict: 'id',
  });

  if (error) {
    throw new Error(`Failed to upsert customer profile: ${error.message}`);
  }
}

export async function fetchCustomerProfile(env: Environment, customerId: string): Promise<CustomerProfile | null> {
  const client = getSupabaseClient(env);
  const { data, error } = await client
    .from('customer_profiles')
    .select('*')
    .eq('id', customerId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch customer profile: ${error.message}`);
  }

  return data as CustomerProfile | null;
}

export async function storeConversationTurns(env: Environment, turns: ConversationTurn[]): Promise<void> {
  if (!turns.length) {
    return;
  }

  const client = getSupabaseClient(env);
  const { error } = await client.from('conversation_turns').insert(turns);

  if (error) {
    throw new Error(`Failed to store conversation turns: ${error.message}`);
  }
}

export async function fetchConversationHistory(
  env: Environment,
  customerId: string,
  channel: ConversationTurn['channel'],
  limit = 20,
): Promise<ConversationTurn[]> {
  const client = getSupabaseClient(env);
  const { data, error } = await client
    .from('conversation_turns')
    .select('*')
    .eq('customerId', customerId)
    .eq('channel', channel)
    .order('createdAt', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch conversation history: ${error.message}`);
  }

  return (data ?? []).reverse() as ConversationTurn[];
}
