'use server';

import { revalidatePath } from 'next/cache';
import { createContentReportFlow, approveContentReportFlow, rejectContentReportFlow } from '@/ai/flows/report-flow';
import { sendNotification as sendNotificationFlow } from '@/ai/flows/notification-flow';
import type { ContentReport, SanctionReason } from '../types';
import { getFirebaseFirestore } from '../firebase-admin';

/**
 * Server Action to securely create a new content report.
 */
export async function createContentReport(input: Omit<ContentReport, 'id' | 'status' | 'createdAt' | 'reason'> & { reason: SanctionReason }) {
    try {
        const db = getFirebaseFirestore();
        await createContentReportFlow(db, input);
        // No revalidation needed on the client side for this action
    } catch (error) {
        console.error('[ACTION_ERROR] createContentReport:', error);
        throw new Error('Failed to create content report.');
    }
}

/**
 * Server Action for an admin to approve a content report, which also deletes the content.
 */
export async function approveContentReport(reportId: string, contentId: string, reportedUserId: string, sanctionReason: SanctionReason) {
    try {
        const db = getFirebaseFirestore();
        await approveContentReportFlow(db, { reportId, contentId, reportedUserId, sanctionReason });
        revalidatePath('/admin');
    } catch (error) {
        console.error('[ACTION_ERROR] approveContentReport:', error);
        throw new Error('Failed to approve content report.');
    }
}

/**
 * Server Action for an admin to reject a content report.
 */
export async function rejectContentReport(reportId: string) {
    try {
        const db = getFirebaseFirestore();
        await rejectContentReportFlow(db, { reportId });
        revalidatePath('/admin');
    } catch (error) {
        console.error('[ACTION_ERROR] rejectContentReport:', error);
        throw new Error('Failed to reject content report.');
    }
}
