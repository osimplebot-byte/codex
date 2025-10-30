import { useEffect, useState } from 'react';
import { OnboardingStep } from '../events';
import { useTrackOnboardingEvent } from '../hooks/useTrackOnboardingEvent';

interface ChannelConnectionStepProps {
  step: OnboardingStep;
  onNext: () => void;
}

export function ChannelConnectionStep({ step, onNext }: ChannelConnectionStepProps) {
  const track = useTrackOnboardingEvent(step.id);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected'>('disconnected');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    void track(step.eventOnStart, {
      stepTitle: step.title,
      availableMethods: ['qrCode'],
      supportsWebView: true,
    });
  }, [step, track]);

  const handleConnect = () => {
    setAttempts((previous) => previous + 1);
    setConnectionStatus('connected');
    if (step.eventOnComplete) {
      void track(step.eventOnComplete, {
        stepTitle: step.title,
        connectionStatus: 'connected',
        attempts: attempts + 1,
      });
    }

    onNext();
  };

  return (
    <section>
      <h2>{step.title}</h2>
      <p>Status da conexão: {connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}</p>
      <button type="button" onClick={handleConnect}>
        Escanear QR Code e continuar
      </button>
    </section>
  );
}
