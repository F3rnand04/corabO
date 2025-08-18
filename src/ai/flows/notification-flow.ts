

'use server';
/**
 * @fileOverview A notification management flow.
 * - sendNotification: Creates a notification document in Firestore.
 * - checkPaymentDeadlines: Scans for overdue payments and sends reminders or alerts.
 * - sendNewCampaignNotifications: Notifies relevant users about a new campaign.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestoreDb } from '@/lib/firebase-server'; // Use server-side firebase
import { collection, doc, setDoc, query, where, getDocs, getDoc, writeBatch } from 'firebase/firestore';
import type { Notification, Transaction, User, Campaign } from '@/lib/types';
import { addDays, differenceInDays, isFuture, isPast } from 'date-fns';

const SendNotificationInputSchema = z.object({
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  link: z.string().optional(),
  type: z.enum(['new_campaign', 'payment_reminder', 'admin_alert', 'welcome', 'affiliation_request', 'payment_warning', 'payment_due', 'new_publication']),
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
 * Scans for upcoming and overdue payments and sends notifications accordingly.
 * This flow is designed to be triggered by a scheduled job (e.g., daily cron).
 */
export const checkPaymentDeadlines = ai.defineFlow(
    {
        name: 'checkPaymentDeadlinesFlow',
        inputSchema: z.void(),
        outputSchema: z.void(),
    },
    async () => {
        const q = query(
            collection(getFirestoreDb(), 'transactions'),
            where('status', 'in', ['Finalizado - Pendiente de Pago', 'Pendiente de Confirmación del Cliente'])
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return;

        const now = new Date();
        
        for (const docSnap of querySnapshot.docs) {
            const tx = docSnap.data() as Transaction;
            // For 'Pendiente de Confirmación', due date is when it was marked complete + grace period
            const dueDate = tx.status === 'Pendiente de Confirmación del Cliente' 
                ? addDays(new Date(tx.date), 1) // 1 day grace period for client to confirm
                : new Date(tx.date);

            if (isFuture(dueDate)) {
                const daysUntilDue = differenceInDays(dueDate, now);
                
                // Proactive Reminders for clients to pay
                if (tx.status === 'Finalizado - Pendiente de Pago' && [7, 2, 1].includes(daysUntilDue)) {
                    await sendNotification({
                        userId: tx.clientId,
                        type: 'payment_reminder',
                        title: 'Recordatorio de Pago Amistoso',
                        message: `Tu pago de $${tx.amount.toFixed(2)} por "${tx.details.serviceName || tx.details.system}" vence en ${daysUntilDue} día(s).`,
                        link: '/transactions'
                    });
                } else if (daysUntilDue === 0) {
                     await sendNotification({
                        userId: tx.clientId,
                        type: 'payment_due',
                        title: '¡Tu pago vence hoy!',
                        message: `Recuerda realizar tu pago de $${tx.amount.toFixed(2)} hoy para mantener tu reputación.`,
                        link: '/transactions'
                    });
                }

            } else if (isPast(dueDate)) {
                const daysOverdue = differenceInDays(now, dueDate);
                 
                 // Alert for clients who haven't paid
                if (tx.status === 'Finalizado - Pendiente de Pago' && daysOverdue >= 1) {
                    if (daysOverdue >= 1 && daysOverdue <= 2) {
                        await sendNotification({
                            userId: tx.clientId,
                            type: 'payment_warning',
                            title: 'Advertencia: Pago Atrasado',
                            message: `Tu pago de $${tx.amount.toFixed(2)} tiene ${daysOverdue} día(s) de retraso. Esto afectará negativamente tu efectividad.`,
                            link: '/transactions'
                        });
                    } else if (daysOverdue >= 3) {
                         await sendNotification({
                            userId: 'corabo-admin', // Special ID for the admin user
                            type: 'admin_alert',
                            title: 'Alerta de Morosidad Crítica',
                            message: `El cliente ${tx.clientId} tiene un pago con ${daysOverdue} días de retraso (ID: ${tx.id}). Se requiere contacto directo.`,
                            link: `/admin?tab=disputes&tx=${tx.id}`
                        });
                    }
                }
                
                // Alert for providers who haven't confirmed a payment sent by client
                if(tx.status === 'Pago Enviado - Esperando Confirmación' && daysOverdue >= 2) {
                    await sendNotification({
                        userId: tx.providerId,
                        type: 'payment_warning',
                        title: 'Acción Requerida: Confirmar Pago',
                        message: `El cliente ${tx.clientId} registró un pago hace ${daysOverdue} días. Por favor, confírmalo para completar la transacción.`,
                        link: '/transactions'
                    });
                }
            }
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
    
    // Default to provider's primary category if no specific interests are segmented
    const targetInterests = campaign.segmentation.interests?.length 
        ? campaign.segmentation.interests 
        : [provider.profileSetupData?.primaryCategory].filter(Boolean);

    if (!targetInterests.length) return;

    const usersRef = collection(db, 'users');
    
    // Query users who are clients and have at least one of the target interests
    const q = query(
        usersRef, 
        where('type', '==', 'client'), 
        where('profileSetupData.categories', 'array-contains-any', targetInterests)
    );
    
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    querySnapshot.forEach(docSnap => {
        const client = docSnap.data() as User;
        
        // FUTURE: Add geographic segmentation logic here
        // e.g., if (campaign.segmentation.geographic && !isInArea(client.location, campaign.segmentation.geographic)) return;

        const notificationId = `notif-${client.id}-${campaignId}`;
        const notificationRef = doc(db, 'notifications', notificationId);
        
        const newNotification: Notification = {
            id: notificationId,
            userId: client.id,
            type: 'new_campaign',
            title: `✨ Nueva oferta de ${provider.name}`,
            message: `"${campaign.budgetLevel === 'premium' ? '¡Exclusivo!' : '¡No te lo pierdas!'}" Una nueva promoción de ${provider.profileSetupData?.specialty} podría interesarte.`,
            link: `/companies/${provider.id}`,
            isRead: false,
            timestamp: new Date().toISOString(),
        };
        batch.set(notificationRef, newNotification);
    });

    await batch.commit();
});

/**
 * Notifies relevant users about a new publication from a provider.
 * This is triggered for reputable providers and sent to a targeted audience.
 */
export const sendNewPublicationNotification = ai.defineFlow({
    name: 'sendNewPublicationNotificationFlow',
    inputSchema: z.object({ providerId: z.string(), publicationId: z.string(), publicationDescription: z.string() }),
    outputSchema: z.void(),
}, async ({ providerId, publicationId, publicationDescription }) => {
    const db = getFirestoreDb();
    
    const providerRef = doc(db, 'users', providerId);
    const providerSnap = await getDoc(providerRef);
    if (!providerSnap.exists()) return;
    const provider = providerSnap.data() as User;

    // Fetch users who have the provider in their contacts
    const q = query(collection(db, 'users'), where('contacts', 'array-contains', providerId));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    querySnapshot.forEach(docSnap => {
        const client = docSnap.data() as User;
        const notificationId = `notif-${client.id}-pub-${publicationId}`;
        const notificationRef = doc(db, 'notifications', notificationId);

        const newNotification: Notification = {
            id: notificationId,
            userId: client.id,
            type: 'new_publication',
            title: `📣 ${provider.name} tiene algo nuevo para ti`,
            message: `"${publicationDescription.slice(0, 50)}..."`,
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
        message: 'Para empezar con el pie derecho, suscríbete y obtén la insignia de verificado.',
        link: '/contacts', // Links to the subscription page
    });
});
