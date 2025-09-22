'use server';

/**
 * @fileOverview Flows for managing content reports.
 */
import { getFirebaseFirestore } from '@/lib/firebase-admin';
import { sendNotification } from './notification-flow';
import type { ContentReport, SanctionReason } from '@/lib/types';


/**
 * Creates a new content report in Firestore.
 */
export async function createContentReportFlow(input: Omit<ContentReport, 'id' | 'status' | 'createdAt'>) {
    const db = getFirebaseFirestore();
    const reportId = `report-${input.reporterId}-${Date.now()}`;
    const newReport: ContentReport = {
        id: reportId,
        ...input,
        status: 'pending',
        createdAt: new Date().toISOString(),
    };
    await db.collection('reports').doc(reportId).set(newReport);
    
    // Notify admin
    await sendNotification({
        userId: 'corabo-admin',
        type: 'admin_alert',
        title: 'Nueva Denuncia de Contenido',
        message: `Un usuario ha denunciado contenido por: ${input.reason}.`,
        link: '/admin/disputes',
    });
}


/**
 * Approves a content report, deletes the content, and notifies the user.
 */
export async function approveContentReportFlow(input: { reportId: string, contentId: string, reportedUserId: string, sanctionReason: SanctionReason }) {
    const db = getFirebaseFirestore();
    const batch = db.batch();

    // Mark report as reviewed
    const reportRef = db.collection('reports').doc(input.reportId);
    batch.update(reportRef, { 
        status: 'reviewed', 
        sanctionReason: input.sanctionReason, 
        reviewedAt: new Date().toISOString() 
    });

    // Delete the reported publication
    const publicationRef = db.collection('publications').doc(input.contentId);
    batch.delete(publicationRef);

    await batch.commit();
    
    // Notify the reported user
    await sendNotification({
        userId: input.reportedUserId,
        type: 'payment_warning', // Re-using a warning-style notification
        title: 'Contenido Eliminado por Infracción',
        message: `Una de tus publicaciones fue eliminada por el siguiente motivo: ${input.sanctionReason}. Consulta las normas de la comunidad.`,
        link: '/community-guidelines',
    });
}

/**
 * Rejects (dismisses) a content report.
 */
export async function rejectContentReportFlow(input: { reportId: string }) {
    const db = getFirebaseFirestore();
    await db.collection('reports').doc(input.reportId).update({
        status: 'reviewed',
        reviewedAt: new Date().toISOString()
    });
}
