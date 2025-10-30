export { loadEnvironment, type Environment } from './config.js';
export { runOnboardingWorkflow, type OnboardingForm, type OnboardingResult } from './workflows/onboarding.js';
export { runSimulatorWorkflow, type SimulatorInput, type SimulatorResult } from './workflows/simulador.js';
export { runWhatsAppBridgeWorkflow, type WhatsAppWebhookInput } from './workflows/whatsappBridge.js';
export { runHelpdeskWorkflow, type HelpdeskInput, type HelpdeskResult } from './workflows/helpdesk.js';
