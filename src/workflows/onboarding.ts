import { z } from 'zod';
import type { Environment } from '../config.js';
import { nowIso } from '../lib/utils.js';
import { upsertCustomerProfile } from '../lib/supabase.js';

const formSchema = z.object({
  id: z.string().uuid(),
  companyName: z.string().min(1),
  description: z.string().optional(),
  segment: z.string().optional(),
  voiceTone: z.string().optional(),
  openingHours: z.string().optional(),
  products: z.array(z.string()).optional(),
  faqs: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      }),
    )
    .optional(),
  whatsappNumber: z.string().optional(),
});

export type OnboardingForm = z.infer<typeof formSchema>;

export interface OnboardingResult {
  profileId: string;
  syncedAt: string;
}

export async function runOnboardingWorkflow(env: Environment, rawForm: unknown): Promise<OnboardingResult> {
  const form = formSchema.parse(rawForm);

  await upsertCustomerProfile(env, {
    id: form.id,
    companyName: form.companyName,
    description: form.description,
    segment: form.segment,
    voiceTone: form.voiceTone,
    openingHours: form.openingHours,
    products: form.products,
    faqs: form.faqs,
    whatsappNumber: form.whatsappNumber,
    onboardingCompletedAt: nowIso(),
  });

  return {
    profileId: form.id,
    syncedAt: nowIso(),
  };
}
