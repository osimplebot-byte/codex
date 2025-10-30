export interface Environment {
  supabaseUrl: string;
  supabaseServiceKey: string;
  openAiApiKey: string;
  evolutionApiUrl: string;
  evolutionApiToken: string;
  helpdeskEmailFrom: string;
  helpdeskEmailTo: string;
  helpdeskSmtpUrl: string;
  helpdeskEscalationNumber: string;
}

export function loadEnvironment(env: NodeJS.ProcessEnv = process.env): Environment {
  const required = {
    supabaseUrl: env.SUPABASE_URL,
    supabaseServiceKey: env.SUPABASE_SERVICE_KEY,
    openAiApiKey: env.OPENAI_API_KEY,
    evolutionApiUrl: env.EVOLUTION_API_URL,
    evolutionApiToken: env.EVOLUTION_API_TOKEN,
    helpdeskEmailFrom: env.HELPDESK_EMAIL_FROM,
    helpdeskEmailTo: env.HELPDESK_EMAIL_TO,
    helpdeskSmtpUrl: env.HELPDESK_SMTP_URL,
    helpdeskEscalationNumber: env.HELPDESK_ESCALATION_NUMBER,
  } as const;

  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      throw new Error(`Missing environment variable: ${key}`);
    }
  }

  return required as Environment;
}
