'use server';

import { getFirebaseFirestore } from '../firebase-admin';
import { sendNewQuoteRequestNotificationsFlow, sendNotification, getNotificationsFlow } from '@/ai/flows/notification-flow';
import type { NotificationType } from '../types';
import { revalidatePath } from 'next/cache';

/**
 * Server Action to securely trigger the new quote request notification flow.
 * This acts as a safe bridge between client components and server-side logic.
 */
export async function sendNewQuoteRequestNotifications(input: {
    category: string;
    title: string;
    transactionId: string;
    limitedReach?: boolean;
}) {
    // This action simply calls the underlying flow, ensuring that the
    // `firebase-admin` dependency is never exposed to the client.
    await sendNewQuoteRequestNotificationsFlow(input);
}


/**
 * Marks all unread notifications for a user as read.
 */
export async function markNotificationsAsRead(userId: string) {
  if (!userId) return;
  const db = getFirebaseFirestore();
  const notificationsRef = db.collection('notifications');
  const q = notificationsRef.where('userId', '==', userId).where('isRead', '==', false);
  
  try {
    const snapshot = await q.get();
    if (snapshot.empty) return;

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isRead: true });
    });

    await batch.commit();
    revalidatePath('/notifications'); // Revalidate to update UI
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    // Do not throw error to client, log it on the server
  }
}

/**
 * Fetches notifications for a user with pagination.
 */
export async function getNotifications(userId: string, limitNum: number, startAfterDocId?: string) {
    return await getNotificationsFlow({ userId, limitNum, startAfterDocId });
}
