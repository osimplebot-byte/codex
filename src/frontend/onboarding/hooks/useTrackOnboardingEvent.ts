import { useCallback } from 'react';
import { trackOnboardingEvent, OnboardingEventName } from '../../analytics';
import type { OnboardingEventPayload } from '../../analytics/analyticsClient';
import { ONBOARDING_EVENT_CONTEXT } from '../events';

export function useTrackOnboardingEvent(stepId: string) {
  return useCallback(
    async (eventName: OnboardingEventName, metadata?: Record<string, unknown>) => {
      const payload: OnboardingEventPayload = {
        stepId,
        status: eventName.endsWith('Completed') ? 'completed' : 'started',
        timestamp: new Date().toISOString(),
        metadata: {
          ...ONBOARDING_EVENT_CONTEXT,
          ...metadata,
        },
      };

      await trackOnboardingEvent(eventName, payload);
    },
    [stepId],
  );
}
