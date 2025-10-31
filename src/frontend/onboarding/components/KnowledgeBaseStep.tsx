import { FormEvent, useEffect, useState } from 'react';
import { OnboardingStep } from '../events';
import { useTrackOnboardingEvent } from '../hooks/useTrackOnboardingEvent';

interface KnowledgeBaseStepProps {
  step: OnboardingStep;
  onNext: () => void;
}

export function KnowledgeBaseStep({ step, onNext }: KnowledgeBaseStepProps) {
  const track = useTrackOnboardingEvent(step.id);
  const [faqCount, setFaqCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [toneOfVoice, setToneOfVoice] = useState('');

  useEffect(() => {
    void track(step.eventOnStart, {
      stepTitle: step.title,
      datasetTypes: ['workingHours', 'toneOfVoice', 'catalog', 'faqs'],
    });
  }, [step, track]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (step.eventOnComplete) {
      void track(step.eventOnComplete, {
        stepTitle: step.title,
        faqEntries: faqCount,
        catalogItems: productCount,
        toneConfigured: Boolean(toneOfVoice),
      });
    }

    onNext();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{step.title}</h2>
      <label>
        Quantidade de FAQs cadastradas
        <input
          type="number"
          min={0}
          value={faqCount}
          onChange={(event) => setFaqCount(Number(event.target.value))}
        />
      </label>
      <label>
        Itens do catálogo
        <input
          type="number"
          min={0}
          value={productCount}
          onChange={(event) => setProductCount(Number(event.target.value))}
        />
      </label>
      <label>
        Tom de voz
        <select value={toneOfVoice} onChange={(event) => setToneOfVoice(event.target.value)}>
          <option value="">Selecione</option>
          <option value="formal">Formal</option>
          <option value="casual">Casual</option>
          <option value="divertido">Divertido</option>
        </select>
      </label>
      <button type="submit">Salvar e continuar</button>
    </form>
  );
}
