import { FormEvent, useEffect, useState } from 'react';
import { OnboardingStep } from '../events';
import { useTrackOnboardingEvent } from '../hooks/useTrackOnboardingEvent';

interface ProfileStepProps {
  step: OnboardingStep;
  onNext: () => void;
}

export function ProfileStep({ step, onNext }: ProfileStepProps) {
  const track = useTrackOnboardingEvent(step.id);
  const [businessName, setBusinessName] = useState('');
  const [segment, setSegment] = useState('');
  const [hasWhatsAppNumber, setHasWhatsAppNumber] = useState(false);

  useEffect(() => {
    void track(step.eventOnStart, {
      stepTitle: step.title,
      requiredFields: ['businessName', 'segment', 'whatsappNumber'],
    });
  }, [step, track]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const completedFields = Number(Boolean(businessName)) + Number(Boolean(segment)) + Number(hasWhatsAppNumber);
    if (step.eventOnComplete) {
      void track(step.eventOnComplete, {
        stepTitle: step.title,
        fieldsCompletedCount: completedFields,
        hasWhatsAppNumber,
      });
    }

    onNext();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{step.title}</h2>
      <label>
        Nome da empresa
        <input value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Minha Empresa" />
      </label>
      <label>
        Segmento
        <input value={segment} onChange={(event) => setSegment(event.target.value)} placeholder="Restaurante" />
      </label>
      <label>
        <input
          type="checkbox"
          checked={hasWhatsAppNumber}
          onChange={(event) => setHasWhatsAppNumber(event.target.checked)}
        />
        Já possui WhatsApp Business ativo
      </label>
      <button type="submit">Salvar e continuar</button>
    </form>
  );
}
