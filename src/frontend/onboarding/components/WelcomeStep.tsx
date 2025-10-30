import { useEffect } from 'react';
import { OnboardingStep } from '../events';
import { useTrackOnboardingEvent } from '../hooks/useTrackOnboardingEvent';

interface WelcomeStepProps {
  step: OnboardingStep;
  onNext: () => void;
}

export function WelcomeStep({ step, onNext }: WelcomeStepProps) {
  const track = useTrackOnboardingEvent(step.id);

  useEffect(() => {
    void track(step.eventOnStart, { stepTitle: step.title, entryPoint: 'dashboard_onboarding' });
  }, [step, track]);

  return (
    <section>
      <h2>{step.title}</h2>
      <p>{step.description}</p>
      <button type="button" onClick={onNext}>
        Começar configuração
      </button>
    </section>
  );
}
