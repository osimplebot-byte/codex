import { useEffect } from 'react';
import { OnboardingStep } from '../events';
import { useTrackOnboardingEvent } from '../hooks/useTrackOnboardingEvent';

interface SummaryStepProps {
  step: OnboardingStep;
  onFinish: () => void;
}

export function SummaryStep({ step, onFinish }: SummaryStepProps) {
  const track = useTrackOnboardingEvent(step.id);

  useEffect(() => {
    void track(step.eventOnStart, { stepTitle: step.title });
  }, [step, track]);

  const handleFinish = () => {
    if (step.eventOnComplete) {
      void track(step.eventOnComplete, {
        stepTitle: step.title,
        checklistCompleted: true,
      });
    }
    onFinish();
  };

  return (
    <section>
      <h2>{step.title}</h2>
      <p>Revise seus dados, teste o simulador e finalize a configuração.</p>
      <button type="button" onClick={handleFinish}>
        Finalizar onboarding
      </button>
    </section>
  );
}
