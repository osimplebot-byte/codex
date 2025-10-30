import { AnalyticsBrowser, AnalyticsBrowserSettings } from '@segment/analytics-next';

export type AnalyticsEnvironment = 'development' | 'staging' | 'production' | string;

export interface AnalyticsInitializationOptions {
  /**
   * Optional Segment (or compatible) settings forwarded to the SDK.
   */
  sdkSettings?: AnalyticsBrowserSettings;
  /**
   * Explicit environment flag when NODE_ENV is not descriptive enough.
   */
  environment?: AnalyticsEnvironment;
  /**
   * Environments in which event delivery is allowed. Defaults to staging/production.
   */
  allowedEnvironments?: AnalyticsEnvironment[];
}

export type OnboardingEventName =
  | 'OnboardingStarted'
  | 'ProfileStepStarted'
  | 'ProfileStepCompleted'
  | 'BusinessDataStepStarted'
  | 'BusinessDataStepCompleted'
  | 'ChannelConnectionStepStarted'
  | 'ChannelConnectionStepCompleted'
  | 'SummaryStepStarted'
  | 'OnboardingCompleted';

export interface OnboardingEventPayload {
  stepId: string;
  status: 'started' | 'completed';
  timestamp: string;
  metadata?: Record<string, unknown>;
}

let analytics: AnalyticsBrowser | null = null;
let hasWarnedMissingKey = false;

const PERSONAL_KEYS = new Set([
  'email',
  'phone',
  'phoneNumber',
  'fullName',
  'document',
  'taxId',
  'cpf',
  'cnpj',
]);

const DEFAULT_ALLOWED_ENVIRONMENTS: AnalyticsEnvironment[] = ['staging', 'production'];

function maskValue(value: unknown): unknown {
  if (value == null) {
    return value;
  }

  if (typeof value === 'string') {
    if (!value.trim()) {
      return value;
    }
    return '[REDACTED]';
  }

  if (Array.isArray(value)) {
    return value.map((item) => maskValue(item));
  }

  if (typeof value === 'object') {
    return sanitizePayload(value as Record<string, unknown>);
  }

  return value;
}

function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  return Object.entries(payload).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (PERSONAL_KEYS.has(key)) {
      acc[key] = maskValue(value);
      return acc;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      acc[key] = sanitizePayload(value as Record<string, unknown>);
      return acc;
    }

    if (Array.isArray(value)) {
      acc[key] = value.map((item) => (typeof item === 'object' ? sanitizePayload(item as Record<string, unknown>) : maskValue(item)));
      return acc;
    }

    acc[key] = value;
    return acc;
  }, {});
}

function isAllowedEnvironment(options?: AnalyticsInitializationOptions): boolean {
  const environment = options?.environment ?? process.env.REACT_APP_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development';
  const allowed = options?.allowedEnvironments ?? DEFAULT_ALLOWED_ENVIRONMENTS;
  return allowed.includes(environment);
}

export function initializeAnalytics(writeKey?: string, options?: AnalyticsInitializationOptions): void {
  if (!writeKey) {
    if (!hasWarnedMissingKey) {
      console.warn('[analytics] Missing Segment write key. Events will be logged to the console.');
      hasWarnedMissingKey = true;
    }
    return;
  }

  if (!isAllowedEnvironment(options)) {
    console.info('[analytics] Analytics disabled for the current environment.');
    return;
  }

  analytics = AnalyticsBrowser.load({ writeKey, ...options?.sdkSettings });
}

export async function trackOnboardingEvent(eventName: OnboardingEventName, payload: OnboardingEventPayload): Promise<void> {
  const sanitizedPayload = sanitizePayload(payload.metadata ?? {});
  const eventBody = {
    stepId: payload.stepId,
    status: payload.status,
    timestamp: payload.timestamp,
    metadata: sanitizedPayload,
  };

  if (!analytics) {
    console.info(`[analytics] ${eventName}`, eventBody);
    return;
  }

  await analytics.track(eventName, eventBody);
}

