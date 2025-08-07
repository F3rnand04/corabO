'use server';
/**
 * @fileOverview A campaign management flow.
 *
 * - createCampaignFlow - A function that handles creating a new ad campaign.
 * - CreateCampaignInput - The input type for the createCampaignFlow function.
 * - Campaign - The return type for the createCampaignFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {
  type User,
  type Campaign,
  type Transaction,
  credicoraLevels,
} from '@/lib/types';
import {db} from '@/lib/firebase';
import {doc, getDoc, writeBatch} from 'firebase/firestore';

const CreateCampaignInputSchema = z.object({
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
  financedWithCredicora: z.boolean(),
  appliedSubscriptionDiscount: z.number(),
});

export type CreateCampaignInput = z.infer<typeof CreateCampaignInputSchema>;

// The campaign type is already defined in src/lib/types.ts, so we can reuse it.
const CampaignOutputSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  publicationId: z.string(),
  budget: z.number(),
  durationDays: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum([
    'pending_payment',
    'active',
    'completed',
    'cancelled',
  ]),
  stats: z.object({
    impressions: z.number(),
    reach: z.number(),
    clicks: z.number(),
    messages: z.number(),
  }),
  budgetLevel: z.enum(['basic', 'advanced', 'premium']),
  dailyBudget: z.number(),
  segmentation: z.object({
    geographic: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
  }),
  appliedSubscriptionDiscount: z.number().optional(),
  financedWithCredicora: z.boolean(),
});

export async function createCampaign(
  input: CreateCampaignInput
): Promise<Campaign> {
  return createCampaignFlow(input);
}

const createCampaignFlow = ai.defineFlow(
  {
    name: 'createCampaignFlow',
    inputSchema: CreateCampaignInputSchema,
    outputSchema: CampaignOutputSchema,
  },
  async (input: CreateCampaignInput) => {
    const userRef = doc(db, 'users', input.userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User not found');
    }

    const user = userSnap.data() as User;

    const batch = writeBatch(db);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + input.durationDays);

    const campaignId = `camp-${Date.now()}`;
    const newCampaign: Campaign = {
      id: campaignId,
      providerId: user.id,
      publicationId: input.publicationId,
      budget: input.budget,
      durationDays: input.durationDays,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'pending_payment',
      stats: {impressions: 0, reach: 0, clicks: 0, messages: 0},
      ...input,
    };

    const campaignRef = doc(db, 'campaigns', campaignId);
    batch.set(campaignRef, newCampaign);

    // Create system transaction for the payment
    const txId = `txn-camp-${Date.now()}`;
    const campaignTransaction: Transaction = {
      id: txId,
      type: 'Sistema',
      status: 'Finalizado - Pendiente de Pago',
      date: new Date().toISOString(),
      amount: input.budget,
      clientId: user.id,
      providerId: 'corabo', // System transaction
      participantIds: [user.id, 'corabo'],
      details: {
        system: `Pago de campaña publicitaria: ${newCampaign.id}`,
        paymentMethod: input.financedWithCredicora ? 'credicora' : 'direct',
      },
    };

    const txRef = doc(db, 'transactions', txId);
    batch.set(txRef, campaignTransaction);

    // Update user's active campaigns
    const updatedCampaignIds = [...(user.activeCampaignIds || []), campaignId];
    batch.update(userRef, {activeCampaignIds: updatedCampaignIds});

    await batch.commit();

    return newCampaign;
  }
);
