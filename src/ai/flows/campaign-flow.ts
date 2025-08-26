/**
 * @fileOverview A campaign management flow.
 *
 * - createCampaignFlow - A function that handles creating a new ad campaign.
 * - CreateCampaignInput - The input type for the createCampaignFlow function.
 * - Campaign - The return type for the createCampaignFlow function.
 */
import {z} from 'zod';
import {
  type User,
  type Campaign,
  type Transaction,
} from '@/lib/types';
import { getFirestore } from 'firebase-admin/firestore';


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


export async function createCampaignFlow(input: CreateCampaignInput): Promise<Campaign> {
    const db = getFirestore();
    const userRef = db.collection('users').doc(input.userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists() || (userSnap.data() as User).type !== 'provider') {
      throw new Error('User not found or is not a provider.');
    }

    const user = userSnap.data() as User;
    const batch = db.batch();
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
      budgetLevel: input.budgetLevel,
      dailyBudget: input.dailyBudget,
      segmentation: input.segmentation,
      appliedSubscriptionDiscount: input.appliedSubscriptionDiscount,
      financedWithCredicora: input.financedWithCredicora && input.budget >= 20,
    };

    const campaignRef = db.collection('campaigns').doc(newCampaign.id);
    batch.set(campaignRef, newCampaign);

    const txId = `txn-camp-${Date.now()}`;
    const campaignTransaction: Transaction = {
      id: txId,
      type: 'Sistema',
      status: 'Pago Enviado - Esperando Confirmación',
      date: new Date().toISOString(),
      amount: input.budget,
      clientId: user.id,
      providerId: 'corabo-admin',
      participantIds: [user.id, 'corabo-admin'],
      details: {
        system: `Pago de campaña publicitaria: ${newCampaign.id}`,
        paymentMethod: newCampaign.financedWithCredicora ? 'credicora' : 'direct',
        paymentVoucherUrl: 'https://i.postimg.cc/L8y2zWc2/vzla-id.png'
      },
    };

    const txRef = db.collection('transactions').doc(txId);
    batch.set(txRef, campaignTransaction);

    const updatedCampaignIds = [...(user.activeCampaignIds || []), newCampaign.id];
    batch.update(userRef, {activeCampaignIds: updatedCampaignIds});
    
    await batch.commit();
        
    return newCampaign;
  }
