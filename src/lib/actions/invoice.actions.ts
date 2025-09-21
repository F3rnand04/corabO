
'use server';

import { revalidatePath } from 'next/cache';
import { generateProviderInvoiceFlow } from '@/ai/flows/invoice-flow';

/**
 * Triggers the monthly invoice generation process for all providers.
 * Includes a retry mechanism with exponential backoff for resilience.
 */
export async function generateMonthlyInvoices(month: number, year: number) {
    const db = getFirebaseFirestore();
    const providersQuery = db.collection('users').where('type', 'in', ['provider', 'repartidor']);
    const providersSnap = await providersQuery.get();

    if (providersSnap.empty) {
        console.log("No providers found to generate invoices for.");
        return { success: true, message: "No providers found." };
    }

    let processedCount = 0;
    const errors = [];
    const MAX_RETRIES = 3;

    for (const doc of providersSnap.docs) {
        let retries = 0;
        let success = false;
        while (retries < MAX_RETRIES && !success) {
            try {
                await generateProviderInvoiceFlow({ providerId: doc.id, month, year });
                processedCount++;
                success = true; // Mark as success to exit the while loop
            } catch (error: any) {
                retries++;
                console.error(`Attempt ${'${retries}'} failed for provider ${'${doc.id}'}:`, error.message);
                if (retries >= MAX_RETRIES) {
                    console.error(`All retries failed for provider ${'${doc.id}'}. Final error:`, error);
                    errors.push({ providerId: doc.id, error: error.message });
                } else {
                    const delay = Math.pow(2, retries - 1) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
    }

    if (errors.length > 0) {
        console.error("Invoice generation completed with errors.", { errors });
        return { success: false, message: `Invoice generation completed with ${'${errors.length}'} errors.` };
    }
    
    revalidatePath('/admin');
    return { success: true, message: `Successfully processed invoices for ${'${processedCount}'} providers.` };
}
