'use server';

import { revalidatePath } from 'next/cache';
import { getFirebaseFirestore } from '@/lib/firebase-admin';
import type { LiveStream, User, Gift } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';
import { gifts } from '../data/options';
import { sendNotification } from '@/ai/flows/notification-flow';

/**
 * Creates a new live stream document and updates the user's status.
 */
export async function startLiveStream(data: Pick<LiveStream, 'creatorId' | 'title' | 'description' | 'visibility' | 'accessCostCredits'>): Promise<LiveStream> {
    const db = getFirebaseFirestore();
    const batch = db.batch();
    
    const liveStreamId = `live_${data.creatorId}_${Date.now()}`;
    const liveStreamRef = db.collection('livestreams').doc(liveStreamId);
    
    const newLiveStream: LiveStream = {
        id: liveStreamId,
        status: 'live',
        startedAt: new Date().toISOString(),
        ...data,
    };

    batch.set(liveStreamRef, newLiveStream);

    const userRef = db.collection('users').doc(data.creatorId);
    batch.update(userRef, { activeLiveStreamId: liveStreamId });

    await batch.commit();

    revalidatePath('/videos');
    revalidatePath(`/companies/${data.creatorId}`);
    return newLiveStream;
}


/**
 * Allows a viewer to request access to a private live stream.
 */
export async function requestPrivateLiveAccess(liveStreamId: string, requesterId: string) {
    const db = getFirebaseFirestore();
    const liveStreamRef = db.collection('livestreams').doc(liveStreamId);
    const liveStreamSnap = await liveStreamRef.get();
    
    if (!liveStreamSnap.exists()) throw new Error("Live stream not found.");
    const liveStream = liveStreamSnap.data() as LiveStream;

    await liveStreamRef.update({
        pendingRequests: FieldValue.arrayUnion(requesterId)
    });
    
    await sendNotification({
        userId: liveStream.creatorId,
        type: 'live_access_request',
        title: 'Solicitud de Acceso al Live',
        message: 'Un usuario quiere unirse a tu transmisión privada.',
        link: '/videos', // Link to the live page
        metadata: { liveStreamId }
    });

    revalidatePath('/videos');
}

/**
 * Allows a creator to approve a viewer's request for a private live stream.
 */
export async function approveLiveAccess(liveStreamId: string, viewerId: string) {
    const db = getFirebaseFirestore();
    const liveStreamRef = db.collection('livestreams').doc(liveStreamId);

    await db.runTransaction(async (transaction) => {
        const liveStreamDoc = await transaction.get(liveStreamRef);
        if (!liveStreamDoc.exists) throw new Error("Live stream not found.");
        
        const liveStream = liveStreamDoc.data() as LiveStream;
        
        const updatedRequests = (liveStream.pendingRequests || []).filter(id => id !== viewerId);
        
        transaction.update(liveStreamRef, {
            pendingRequests: updatedRequests,
            approvedViewers: FieldValue.arrayUnion(viewerId)
        });
    });

    // Notify the viewer that their request was approved
    await sendNotification({
        userId: viewerId,
        type: 'admin_alert', // Reusing a generic notification type
        title: '¡Acceso Aprobado!',
        message: 'Tu solicitud para unirte al directo privado ha sido aprobada. Ahora puedes unirte enviando el regalo requerido.',
        link: '/videos' 
    });

    revalidatePath('/videos');
}


/**
 * Finalizes entry into a private live stream by consuming a gift.
 */
export async function joinPrivateLiveWithGift(liveStreamId: string, viewerId: string, giftId: string): Promise<{ success: boolean; message: string }> {
    const db = getFirebaseFirestore();
    const liveStreamRef = db.collection('livestreams').doc(liveStreamId);
    const viewerRef = db.collection('users').doc(viewerId);

    const gift = gifts.find(g => g.id === giftId);
    if (!gift) return { success: false, message: "Regalo no válido." };

    const liveStream = (await liveStreamRef.get()).data() as LiveStream;
    if (!liveStream || liveStream.visibility !== 'private') {
        return { success: false, message: "Este no es un directo privado." };
    }

    if (gift.credits < (liveStream.accessCostCredits || 0)) {
        return { success: false, message: `Este regalo no cubre el costo de entrada de ${liveStream.accessCostCredits} créditos.` };
    }
    
    // In a real app, you would verify the user has the gift/credits to spend.
    // For this prototype, we'll assume they do and credit the creator.
    const creatorRef = db.collection('users').doc(liveStream.creatorId);
    await creatorRef.update({
        giftCredits: FieldValue.increment(gift.credits)
    });
    
    return { success: true, message: "¡Bienvenido al directo!" };
}
