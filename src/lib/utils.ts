import { randomUUID } from 'crypto';

export function nowIso(): string {
  return new Date().toISOString();
}

export function generateTurnId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

export function newConversationId(): string {
  return randomUUID();
}
