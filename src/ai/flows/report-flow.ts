'use server';

/**
 * @fileOverview Flows for managing content reports.
 */
import { sendNotification } from './notification-flow';
import type { ContentReport, SanctionReason } from '@/lib/types';
import type { Firestore } from 'firebase-admin/firestore';


/**
 * Creates a new content report in Firestore.
 */
export async function createContentReportFlow(db: Firestore, input: Omit<ContentReport, 'id' | 'status' | 'createdAt'>) {
    const reportId = `report-${input.reporterId}-${Date.now()}`;
    const newReport: ContentReport = {
        id: reportId,
        ...input,
        status: 'pending',
        createdAt: new Date().toISOString(),
    };
    await db.collection('reports').doc(reportId).set(newReport);
    
    // Notify admin
    await sendNotification(db, {
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
export async function approveContentReportFlow(db: Firestore, input: { reportId: string, contentId: string, reportedUserId: string, sanctionReason: SanctionReason }) {
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
    await sendNotification(db, {
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
export async function rejectContentReportFlow(db: Firestore, input: { reportId: string }) {
    await db.collection('reports').doc(input.reportId).update({
        status: 'reviewed',
        reviewedAt: new Date().toISOString()
    });
}
