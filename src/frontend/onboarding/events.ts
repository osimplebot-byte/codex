import { OnboardingEventName } from '../analytics';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  eventOnStart: OnboardingEventName;
  eventOnComplete?: OnboardingEventName;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo',
    description: 'Introdução ao painel e checklist do que será configurado.',
    eventOnStart: 'OnboardingStarted',
  },
  {
    id: 'profile',
    title: 'Perfil da empresa',
    description: 'Coleta de informações básicas como nome da empresa e segmento.',
    eventOnStart: 'ProfileStepStarted',
    eventOnComplete: 'ProfileStepCompleted',
  },
  {
    id: 'knowledge-base',
    title: 'Dados da IA',
    description: 'Formulário com horários, tom de voz, FAQs e catálogo.',
    eventOnStart: 'BusinessDataStepStarted',
    eventOnComplete: 'BusinessDataStepCompleted',
  },
  {
    id: 'channels',
    title: 'Conectar WhatsApp',
    description: 'Conexão do WhatsApp Business via QR Code.',
    eventOnStart: 'ChannelConnectionStepStarted',
    eventOnComplete: 'ChannelConnectionStepCompleted',
  },
  {
    id: 'summary',
    title: 'Revisão final',
    description: 'Checklist final para garantir que tudo está pronto.',
    eventOnStart: 'SummaryStepStarted',
    eventOnComplete: 'OnboardingCompleted',
  },
];

export const ONBOARDING_EVENT_CONTEXT = {
  product: 'onboarding',
  surface: 'web',
};
