'use server';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { addDays, formatISO } from 'date-fns';
import type { Campaign } from '@/lib/types';
import { createTransactionFlow } from './transaction-flow';

export const CreateCampaignInputSchema = z.object({
  userId: z.string(),
  publicationId: z.string(),
  budget: z.number(),
  durationDays: z.number(),
  budgetLevel: z.enum(['basic', 'advanced', 'premium']),
  dailyBudget: z.number(),
  segmentation: z.object({
    geographic: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
  }),
  appliedSubscriptionDiscount: z.number().optional(),
  financedWithCredicora: z.boolean(),
});

export type CreateCampaignInput = z.infer<typeof CreateCampaignInputSchema>;

export async function createCampaignFlow(input: CreateCampaignInput): Promise<Campaign> {
  const db = getFirestore();
  const campaignId = `camp-${input.userId}-${Date.now()}`;
  
  const startDate = new Date();
  const endDate = addDays(startDate, input.durationDays);

  const newCampaign: Campaign = {
    id: campaignId,
    providerId: input.userId,
    publicationId: input.publicationId,
    budget: input.budget,
    durationDays: input.durationDays,
    startDate: formatISO(startDate),
    endDate: formatISO(endDate),
    status: 'pending_payment',
    stats: {
      impressions: 0,
      reach: 0,
      clicks: 0,
      messages: 0,
    },
    budgetLevel: input.budgetLevel,
    dailyBudget: input.dailyBudget,
    segmentation: input.segmentation,
    appliedSubscriptionDiscount: input.appliedSubscriptionDiscount,
    financedWithCredicora: input.financedWithCredicora,
  };
  
  // Create a system transaction for the payment of this campaign
  await createTransactionFlow({
    type: 'Sistema',
    status: 'Pago Enviado - Esperando Confirmación', // User pays immediately, admin must verify
    date: new Date().toISOString(),
    amount: input.budget,
    clientId: input.userId,
    providerId: 'corabo-admin', // Payment is to the system
    participantIds: [input.userId, 'corabo-admin'],
    details: {
        system: `Pago de campaña publicitaria: ${campaignId}`,
    }
  });

  await db.collection('campaigns').doc(campaignId).set(newCampaign);
  
  return newCampaign;
}
