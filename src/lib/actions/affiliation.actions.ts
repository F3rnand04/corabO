'use server';

import { revalidatePath } from 'next/cache';
import { approveAffiliationFlow, rejectAffiliationFlow, revokeAffiliationFlow, requestAffiliationFlow } from '@/ai/flows/affiliation-flow';
import { sendNotification } from '@/ai/flows/notification-flow';


/**
 * A professional requests to be affiliated with a company.
 * This action orchestrates the flow and sends a notification.
 */
export async function requestAffiliation(providerId: string, companyId: string) {
    try {
        await requestAffiliationFlow({ providerId, companyId });

        // Notify the company admin
        sendNotification({
            userId: companyId,
            type: 'affiliation_request',
            title: 'Nueva Solicitud de Asociación',
            message: `Un profesional desea asociarse a tu red de talento.`,
            link: '/admin?tab=affiliations',
        });
        
        revalidatePath('/admin');
    } catch (error: any) {
        console.error(`[ACTION_ERROR] requestAffiliation:`, error);
        throw new Error(error.message || "Failed to request affiliation.");
    }
}

/**
 * A company approves a professional's affiliation request.
 */
export async function approveAffiliation(affiliationId: string, actorId: string) {
    try {
        await approveAffiliationFlow({ affiliationId, actorId });

        const providerId = affiliationId.split('-')[1];
        sendNotification({
            userId: providerId,
            type: 'admin_alert', // Re-using for simplicity
            title: '¡Asociación Aprobada!',
            message: `Tu solicitud para unirte a una red de talento ha sido aprobada.`,
            link: '/profile/publications',
        });

        revalidatePath('/admin');
        revalidatePath(`/companies/${providerId}`);
    } catch (error) {
        console.error(`[ACTION_ERROR] approveAffiliation:`, error);
        throw new Error("Failed to approve affiliation.");
    }
}

/**
 * A company rejects a professional's affiliation request.
 */
export async function rejectAffiliation(affiliationId: string, actorId: string) {
    try {
        await rejectAffiliationFlow({ affiliationId, actorId });
        const providerId = affiliationId.split('-')[1];
         sendNotification({
            userId: providerId,
            type: 'admin_alert',
            title: 'Solicitud de Asociación Rechazada',
            message: `Tu solicitud de asociación ha sido rechazada.`,
            link: '/profile/publications',
        });
        revalidatePath('/admin');
    } catch (error) {
        console.error(`[ACTION_ERROR] rejectAffiliation:`, error);
        throw new Error("Failed to reject affiliation.");
    }
}

/**
 * A company revokes an existing affiliation.
 */
export async function revokeAffiliation(affiliationId: string, actorId: string) {
    try {
        await revokeAffiliationFlow({ affiliationId, actorId });
        const providerId = affiliationId.split('-')[1];
        sendNotification({
            userId: providerId,
            type: 'admin_alert',
            title: 'Asociación Revocada',
            message: `Tu asociación con una empresa ha sido revocada.`,
            link: '/profile/publications',
        });
        revalidatePath('/admin');
        revalidatePath(`/companies/${providerId}`);
    } catch (error) {
        console.error(`[ACTION_ERROR] revokeAffiliation:`, error);
        throw new Error("Failed to revoke affiliation.");
    }
}
