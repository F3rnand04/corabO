
'use server';

import { revalidatePath } from 'next/cache';
import { createContentReportFlow, approveContentReportFlow, rejectContentReportFlow } from '@/ai/flows/report-flow';
import type { ContentReport, SanctionReason } from '../types';

/**
 * Server Action to securely create a new content report.
 */
export async function createContentReport(input: Omit<ContentReport, 'id' | 'status' | 'createdAt' | 'reason'> & { reason: SanctionReason }) {
    try {
        await createContentReportFlow(input);
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
        await approveContentReportFlow({ reportId, contentId, reportedUserId, sanctionReason });
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
        await rejectContentReportFlow({ reportId });
        revalidatePath('/admin');
    } catch (error) {
        console.error('[ACTION_ERROR] rejectContentReport:', error);
        throw new Error('Failed to reject content report.');
    }
}
