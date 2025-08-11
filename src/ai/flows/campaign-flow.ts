
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
import { getFirestoreDb } from '@/lib/firebase-server'; // Use server-side firebase
import {collection, doc, getDoc, getDocs, query, writeBatch, where} from 'firebase/firestore';


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
    'verified',
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
    // In a real app with auth, we'd get the UID from the auth context.
    // For now, we trust the input userId but proceed with caution.
    const userRef = doc(getFirestoreDb(), 'users', input.userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists() || userSnap.data().type !== 'provider') {
      throw new Error('User not found or is not a provider.');
    }

    const user = userSnap.data() as User;
    const batch = writeBatch(getFirestoreDb());
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + input.durationDays);

    const campaignId = `camp-${Date.now()}`;
    const newCampaign: Campaign = {
      id: campaignId,
      providerId: user.id, // Ensure providerId is the one from the validated user doc
      publicationId: input.publicationId,
      budget: input.budget,
      durationDays: input.durationDays,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'pending_payment',
      stats: {impressions: 0, reach: 0, clicks: 0, messages: 0},
      budgetLevel: input.budgetLevel,
      dailyBudget: input.dailyBudget,
      segmentation: input.segmentation,
      appliedSubscriptionDiscount: input.appliedSubscriptionDiscount,
      // Business Rule: Credicora financing is only applicable if the final budget is >= $20
      financedWithCredicora: input.financedWithCredicora && input.budget >= 20,
    };

    const campaignRef = doc(getFirestoreDb(), 'campaigns', newCampaign.id);
    batch.set(campaignRef, newCampaign);

    // Create system transaction for the payment
    const txId = `txn-camp-${Date.now()}`;
    const campaignTransaction: Transaction = {
      id: txId,
      type: 'Sistema',
      status: 'Pago Enviado - Esperando Confirmación',
      date: new Date().toISOString(),
      amount: input.budget,
      clientId: user.id,
      providerId: 'corabo-admin', // System transaction
      participantIds: [user.id, 'corabo-admin'],
      details: {
        system: `Pago de campaña publicitaria: ${newCampaign.id}`,
        paymentMethod: newCampaign.financedWithCredicora ? 'credicora' : 'direct',
        paymentVoucherUrl: 'https://i.postimg.cc/L8y2zWc2/vzla-id.png' // Placeholder for voucher
      },
    };

    const txRef = doc(getFirestoreDb(), 'transactions', txId);
    batch.set(txRef, campaignTransaction);

    // Update user's active campaigns
    const updatedCampaignIds = [...(user.activeCampaignIds || []), newCampaign.id];
    batch.update(userRef, {activeCampaignIds: updatedCampaignIds});
    
    await batch.commit();
    
    // Notification is now handled by the admin panel upon payment verification,
    // ensuring campaigns are not announced before they are paid and active.
    
    return newCampaign;
  }
);
