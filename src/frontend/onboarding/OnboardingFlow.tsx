import { useMemo, useState } from 'react';
import { ONBOARDING_STEPS, OnboardingStep } from './events';
import { ChannelConnectionStep, KnowledgeBaseStep, ProfileStep, SummaryStep, WelcomeStep } from './components';

export function OnboardingFlow() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentStep = useMemo<OnboardingStep>(() => ONBOARDING_STEPS[currentIndex], [currentIndex]);

  const goToNextStep = () => {
    setCurrentIndex((previous) => Math.min(previous + 1, ONBOARDING_STEPS.length - 1));
  };

  const finishOnboarding = () => {
    setCompleted(true);
  };

  if (completed) {
    return (
      <section>
        <h2>Onboarding concluído</h2>
        <p>Agora você pode usar o painel completo da plataforma.</p>
      </section>
    );
  }

  switch (currentStep.id) {
    case 'welcome':
      return <WelcomeStep step={currentStep} onNext={goToNextStep} />;
    case 'profile':
      return <ProfileStep step={currentStep} onNext={goToNextStep} />;
    case 'knowledge-base':
      return <KnowledgeBaseStep step={currentStep} onNext={goToNextStep} />;
    case 'channels':
      return <ChannelConnectionStep step={currentStep} onNext={goToNextStep} />;
    case 'summary':
      return <SummaryStep step={currentStep} onFinish={finishOnboarding} />;
    default:
      return (
        <section>
          <h2>Etapa desconhecida</h2>
          <p>Entre em contato com o suporte para continuar.</p>
        </section>
      );
  }
}
