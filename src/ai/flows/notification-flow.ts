

'use server';
/**
 * @fileOverview A notification management flow.
 * - sendNotification: Creates a notification document in Firestore.
 * - checkOverduePayments: Scans for overdue payments and notifies admin.
 * - sendNewCampaignNotifications: Notifies relevant users about a new campaign.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestoreDb } from '@/lib/firebase-server'; // Use server-side firebase
import { collection, doc, setDoc, query, where, getDocs, getDoc, writeBatch } from 'firebase/firestore';
import type { Notification, Transaction, User, Campaign } from '@/lib/types';
import { differenceInHours } from 'date-fns';

const SendNotificationInputSchema = z.object({
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  link: z.string().optional(),
  type: z.enum(['new_campaign', 'payment_reminder', 'admin_alert', 'welcome']),
});

/**
 * Creates a notification document in Firestore. In a real implementation,
 * this flow would also trigger a push notification via a service like FCM.
 */
export const sendNotification = ai.defineFlow(
  {
    name: 'sendNotificationFlow',
    inputSchema: SendNotificationInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const notificationId = `notif-${input.userId}-${Date.now()}`;
    const notificationRef = doc(getFirestoreDb(), 'notifications', notificationId);
    const newNotification: Notification = {
      id: notificationId,
      ...input,
      isRead: false,
      timestamp: new Date().toISOString(),
    };
    await setDoc(notificationRef, newNotification);
  }
);


/**
 * Scans for overdue payments and notifies the system administrator.
 * This flow would be triggered by a scheduled job (e.g., daily cron).
 */
export const checkOverduePayments = ai.defineFlow(
    {
        name: 'checkOverduePaymentsFlow',
        inputSchema: z.void(),
        outputSchema: z.void(),
    },
    async () => {
        const q = query(
            collection(getFirestoreDb(), 'transactions'),
            where('status', '==', 'Finalizado - Pendiente de Pago')
        );

        const querySnapshot = await getDocs(q);
        const now = new Date();
        const overduePayments: Transaction[] = [];

        querySnapshot.forEach(doc => {
            const tx = doc.data() as Transaction;
            const hoursSinceDue = differenceInHours(now, new Date(tx.date));
            if (hoursSinceDue > 24) {
                overduePayments.push(tx);
            }
        });
        
        if(overduePayments.length > 0) {
            await sendNotification({
                userId: 'corabo-admin', // Special ID for the admin user
                type: 'admin_alert',
                title: 'Alerta de Pagos Atrasados',
                message: `Existen ${overduePayments.length} pagos con más de 24 horas de retraso que requieren acción de cobro directo.`,
                link: '/admin?tab=disputes'
            })
        }
    }
);

/**
 * Finds relevant users and notifies them about a new high-budget campaign.
 */
export const sendNewCampaignNotifications = ai.defineFlow({
    name: 'sendNewCampaignNotificationsFlow',
    inputSchema: z.object({ campaignId: z.string() }),
    outputSchema: z.void(),
}, async ({ campaignId }) => {
    const db = getFirestoreDb();
    const campaignRef = doc(db, 'campaigns', campaignId);
    const campaignSnap = await getDoc(campaignRef);
    if (!campaignSnap.exists()) return;
    const campaign = campaignSnap.data() as Campaign;

    const providerRef = doc(db, 'users', campaign.providerId);
    const providerSnap = await getDoc(providerRef);
    if (!providerSnap.exists()) return;
    const provider = providerSnap.data() as User;
    
    const targetCategory = provider.profileSetupData?.primaryCategory;
    if (!targetCategory) return;

    const usersRef = collection(db, 'users');
    
    // This query now relies on a composite index: (type ASC, profileSetupData.categories CONTAINS)
    const q = query(
        usersRef, 
        where('type', '==', 'client'), 
        where('profileSetupData.categories', 'array-contains', targetCategory)
    );
    
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    querySnapshot.forEach(docSnap => {
        const client = docSnap.data() as User;
        const notificationId = `notif-${client.id}-${campaignId}`;
        const notificationRef = doc(db, 'notifications', notificationId);
        
        const newNotification: Notification = {
            id: notificationId,
            userId: client.id,
            type: 'new_campaign',
            title: `Nueva oferta de ${provider.name}`,
            message: `Una nueva campaña de "${provider.profileSetupData?.specialty}" podría interesarte.`,
            link: `/companies/${provider.id}`,
            isRead: false,
            timestamp: new Date().toISOString(),
        };
        batch.set(notificationRef, newNotification);
    });

    await batch.commit();
});

/**
 * Sends a welcome notification to a user who just became a provider.
 */
export const sendWelcomeToProviderNotification = ai.defineFlow({
    name: 'sendWelcomeToProviderNotificationFlow',
    inputSchema: z.object({ userId: z.string() }),
    outputSchema: z.void(),
}, async ({ userId }) => {
    await sendNotification({
        userId: userId,
        type: 'welcome',
        title: '¡Felicidades por convertirte en proveedor!',
        message: 'Para empezar con el pie de derecho, suscríbete y obtén la insignia de verificado.',
        link: '/contacts', // Links to the subscription page
    });
});
