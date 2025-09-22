'use server';
/**
 * @fileOverview A notification management flow.
 * - sendNotification: Creates a notification document in Firestore.
 * - checkPaymentDeadlines: Scans for overdue payments and sends reminders or alerts.
 * - sendNewCampaignNotifications: Notifies relevant users about a new campaign.
 */
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import type { Notification, Transaction, User, Campaign } from '@/lib/types';
import { addDays, differenceInDays, isFuture, isPast } from 'date-fns';

const SendNotificationInputSchema = z.object({
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  link: z.string().optional(),
  type: z.enum(['new_campaign', 'payment_reminder', 'admin_alert', 'welcome', 'affiliation_request', 'payment_warning', 'payment_due', 'new_publication', 'cashier_request', 'new_quote_request', 'monthly_invoice', 'tutorial_request', 'tutorial_payment_request', 'live_access_request']),
  metadata: z.any().optional(),
});

type SendNotificationInput = z.infer<typeof SendNotificationInputSchema>;

/**
 * Creates a notification document in Firestore. In a real implementation,
 * this flow would also trigger a push notification via a service like FCM.
 */
export async function sendNotification(input: SendNotificationInput) {
    const db = getFirestore();
    const notificationId = `notif-${input.userId}-${Date.now()}`;
    const notificationRef = db.collection('notifications').doc(notificationId);
    const newNotification: Notification = {
      id: notificationId,
      ...input,
      isRead: false,
      timestamp: new Date().toISOString(),
    };
    await notificationRef.set(newNotification);
  }



/**
 * Scans for upcoming and overdue payments and sends notifications accordingly.
 * This flow is designed to be triggered by a scheduled job (e.g., daily cron).
 */
export async function checkPaymentDeadlinesFlow() {
    const db = getFirestore();
    const q = db.collection('transactions')
        .where('status', 'in', ['Finalizado - Pendiente de Pago', 'Pendiente de Confirmación del Cliente']);

    const querySnapshot = await q.get();
    if (querySnapshot.empty) return;

    const now = new Date();
    
    for (const docSnap of querySnapshot.docs) {
        const tx = docSnap.data() as Transaction;
        const dueDate = tx.status === 'Pendiente de Confirmación del Cliente' 
            ? addDays(new Date(tx.date), 1) // 1 day grace period for client to confirm
            : new Date(tx.date);

        if (isFuture(dueDate)) {
            const daysUntilDue = differenceInDays(dueDate, now);
            
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


/**
 * Finds relevant users and notifies them about a new high-budget campaign.
 */
export async function sendNewCampaignNotificationsFlow({ campaignId }: { campaignId: string }) {
    const db = getFirestore();
    const campaignRef = db.collection('campaigns').doc(campaignId);
    const campaignSnap = await campaignRef.get();
    if (!campaignSnap.exists) return;
    const campaign = campaignSnap.data() as Campaign;

    const providerRef = db.collection('users').doc(campaign.providerId);
    const providerSnap = await providerRef.get();
    if (!providerSnap.exists) return;
    const provider = providerSnap.data() as User;
    
    const targetInterests = campaign.segmentation.interests?.length 
        ? campaign.segmentation.interests 
        : (provider.profileSetupData?.primaryCategory ? [provider.profileSetupData.primaryCategory] : []);

    if (!targetInterests.length) return;

    const usersRef = db.collection('users');
    
    const q = usersRef
        .where('type', '==', 'client')
        .where('profileSetupData.categories', 'array-contains-any', targetInterests);
    
    const querySnapshot = await q.get();
    const batch = db.batch();

    querySnapshot.forEach(docSnap => {
        const client = docSnap.data() as User;
        const notificationId = `notif-${client.id}-${campaignId}`;
        const notificationRef = db.collection('notifications').doc(notificationId);
        
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
}

/**
 * Notifies relevant users about a new publication or product from a provider.
 * This is triggered for reputable providers and sent to a targeted audience.
 */
export async function sendNewContentNotificationFlow({ providerId, publicationId, publicationDescription, providerName }: { providerId: string, publicationId: string, publicationDescription: string, providerName: string }) {
    const db = getFirestore();
    
    const q = db.collection('users').where('contacts', 'array-contains', providerId);
    const querySnapshot = await q.get();
    const batch = db.batch();

    querySnapshot.forEach(docSnap => {
        const client = docSnap.data() as User;
        const notificationId = `notif-${client.id}-pub-${publicationId}`;
        const notificationRef = db.collection('notifications').doc(notificationId);

        const newNotification: Notification = {
            id: notificationId,
            userId: client.id,
            type: 'new_publication',
            title: `📣 ${providerName} tiene algo nuevo para ti`,
            message: `"${publicationDescription.slice(0, 50)}..."`,
            link: `/companies/${providerId}`,
            isRead: false,
            timestamp: new Date().toISOString(),
        };
        batch.set(notificationRef, newNotification);
    });

    await batch.commit();
}


/**
 * Sends a welcome notification to a user who just became a provider.
 */
export async function sendWelcomeToProviderNotificationFlow({ userId }: { userId: string }) {
    await sendNotification({
        userId: userId,
        type: 'welcome',
        title: '¡Felicidades por convertirte en proveedor!',
        message: 'Para empezar con el pie de derecho, suscríbete y obtén la insignia de verificado.',
        link: '/contacts', // Links to the subscription page
    });
}


/**
 * Fetches notifications for a given user with pagination support.
 */
export async function getNotificationsFlow({ userId, limitNum = 20, startAfterDocId }: { userId: string, limitNum?: number, startAfterDocId?: string }) {
    const db = getFirestore();
    let q = db.collection('notifications')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limitNum);

    if (startAfterDocId) {
        const startAfterDoc = await db.collection('notifications').doc(startAfterDocId).get();
        if (startAfterDoc.exists) {
            q = q.startAfter(startAfterDoc);
        }
    }

    const snapshot = await q.get();
    const notifications = snapshot.docs.map(doc => doc.data() as Notification);
    const lastVisible = snapshot.docs[snapshot.docs.length - 1];

    return {
        notifications,
        lastVisibleDocId: snapshot.docs.length === limitNum ? lastVisible?.id : undefined
    };
}
export async function sendNewQuoteRequestNotificationsFlow(input: {
    category: string;
    title: string;
    transactionId: string;
    limitedReach?: boolean;
}) {
    const db = getFirestore();
    const providersQuery = db.collection('users')
        .where('type', '==', 'provider')
        .where('profileSetupData.primaryCategory', '==', input.category)
        .where('isTransactionsActive', '==', true); // Only notify active providers
    
    const snapshot = await providersQuery.get();
    if (snapshot.empty) {
        console.log(`No active providers found for category: ${input.category}`);
        return;
    }

    const batch = db.batch();
    snapshot.forEach(doc => {
        const provider = doc.data() as User;
        const notificationId = `notif-${provider.id}-quote-${input.transactionId}`;
        const notificationRef = db.collection('notifications').doc(notificationId);
        const newNotification: Notification = {
            id: notificationId,
            userId: provider.id,
            type: 'new_quote_request',
            title: '📣 Nueva Oportunidad de Negocio',
            message: `Un cliente necesita un servicio de "${input.title}" en tu categoría.`,
            link: `/transactions?tx=${input.transactionId}`,
            isRead: false,
            timestamp: new Date().toISOString(),
        };
        batch.set(notificationRef, newNotification);
    });

    await batch.commit();
}
