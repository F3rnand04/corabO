'use server';

/**
 * @fileOverview Flows for managing content reports.
 */
import { getFirebaseFirestore, getFirebaseStorage } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { ContentReport, GalleryImage, SanctionReason } from '@/lib/types';
import { sendNotification } from './notification-flow';


/**
 * Creates a new content report document in Firestore.
 */
export async function createContentReportFlow(input: Omit<ContentReport, 'id' | 'status' | 'createdAt'>): Promise<ContentReport> {
    const db = getFirebaseFirestore();
    const reportId = `report-${'${Date.now()}'}`;
    const reportRef = db.collection('reports').doc(reportId);

    const newReport: ContentReport = {
        ...input,
        id: reportId,
        status: 'pending',
        createdAt: new Date().toISOString(),
    };

    await reportRef.set(newReport);
    return newReport;
}

/**
 * Approves a content report. This marks the report as reviewed, deletes the associated content,
 * penalizes the user, and sends them a notification.
 */
export async function approveContentReportFlow({ reportId, contentId, reportedUserId, sanctionReason }: { reportId: string, contentId: string, reportedUserId: string, sanctionReason: SanctionReason }): Promise<void> {
    const db = getFirebaseFirestore();
    const storage = getFirebaseStorage();
    const batch = db.batch();

    // 1. Delete the publication document and file
    const publicationRef = db.collection('publications').doc(contentId);
    const docSnap = await publicationRef.get();
    
    if (docSnap.exists) {
        const data = docSnap.data() as GalleryImage;
        if (data?.src && data.src.includes('firebasestorage.googleapis.com')) {
            try {
                const filePath = decodeURIComponent(data.src.split('/o/')[1].split('?')[0]);
                const fileRef = storage.bucket().file(filePath);
                await fileRef.delete();
            } catch (storageError) {
                console.error(`Error deleting file from Storage for pub ${'${contentId}'}, but proceeding:`, storageError);
            }
        }
        batch.delete(publicationRef);
    }
    
    // 2. Penalize the user by reducing their effectiveness score
    const userRef = db.collection('users').doc(reportedUserId);
    batch.update(userRef, {
        effectiveness: FieldValue.increment(-5) // Penalize by 5 points
    });

    // 3. Update the report status
    const reportRef = db.collection('reports').doc(reportId);
    batch.update(reportRef, {
        status: 'reviewed',
        reviewedAt: new Date().toISOString(),
        sanctionReason: sanctionReason,
    });
    
    // 4. Send notification to the user
    await sendNotification({
        userId: reportedUserId,
        type: 'payment_warning', // Reusing a strong notification type
        title: 'Advertencia: Contenido Eliminado',
        message: `Tu publicación fue eliminada por infringir nuestras normas. Motivo: ${'${sanctionReason}'}. Infracciones repetidas pueden resultar en la suspensión de tu cuenta.`,
        link: '/community-guidelines',
    });
    
    await batch.commit();
}


/**
 * Rejects a content report, marking it as reviewed without taking action on the content.
 */
export async function rejectContentReportFlow({ reportId }: { reportId: string }): Promise<void> {
    const db = getFirebaseFirestore();
    const reportRef = db.collection('reports').doc(reportId);

    await reportRef.update({
        status: 'reviewed',
        reviewedAt: new Date().toISOString(),
        // In a real app, you'd store the admin's ID here
        // reviewedBy: actorId 
    });
}
