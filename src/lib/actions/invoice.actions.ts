'use server';

import { getFirebaseFirestore } from '@/lib/firebase-admin';
import type { Transaction, User } from '@/lib/types';
import { z } from 'zod';
import { startOfMonth, endOfMonth } from 'date-fns';
import { sendNotification } from '@/ai/flows/notification-flow';
import { countries } from '@/lib/data/options';
import { revalidatePath } from 'next/cache';

const GenerateInvoiceInputSchema = z.object({
  providerId: z.string(),
  month: z.number().min(0).max(11), // 0 for January, 11 for December
  year: z.number(),
});
type GenerateInvoiceInput = z.infer<typeof GenerateInvoiceInputSchema>;


/**
 * Generates a monthly commission invoice for a single provider.
 */
export async function generateProviderInvoiceFlow(input: GenerateInvoiceInput) {
    const db = getFirebaseFirestore();

    const providerRef = db.collection('users').doc(input.providerId);
    const providerSnap = await providerRef.get();
    if (!providerSnap.exists) {
        throw new Error(`Provider with ID ${input.providerId} not found.`);
    }
    const provider = providerSnap.data() as User;
    const countryInfo = countries.find(c => c.code === provider.country);
    const IVA_RATE = countryInfo?.ivaRate || 0.16; // Default to 16% if country not found

    const startDate = startOfMonth(new Date(input.year, input.month));
    const endDate = endOfMonth(new Date(input.year, input.month));
    const monthName = startDate.toLocaleString('es-VE', { month: 'long' });

    // 1. Find all transactions where this provider incurred a commission
    const commissionsQuery = db.collection('transactions')
        .where('clientId', '==', input.providerId)
        .where('providerId', '==', 'corabo-admin')
        .where('date', '>=', startDate.toISOString())
        .where('date', '<=', endDate.toISOString())
        .where('status', '==', 'Finalizado - Pendiente de Pago');

    const commissionsSnap = await commissionsQuery.get();
    
    if (commissionsSnap.empty) {
        console.log(`No commissionable transactions found for provider ${input.providerId} in ${monthName} ${input.year}.`);
        return; // No invoice needed
    }

    const commissionTransactions = commissionsSnap.docs.map(doc => doc.data() as Transaction);
    
    // 2. Calculate totals
    const subtotal = commissionTransactions.reduce((acc, tx) => acc + tx.amount, 0);
    const iva = subtotal * IVA_RATE;
    const total = subtotal + iva;

    if (total <= 0) {
        console.log(`Total commission is zero for provider ${input.providerId}. Skipping invoice.`);
        return;
    }

    // 3. Create the master invoice transaction
    const invoiceId = `inv-${input.providerId}-${input.year}-${input.month + 1}`;
    const invoiceRef = db.collection('transactions').doc(invoiceId);

    const invoiceTransaction: Transaction = {
        id: invoiceId,
        type: 'Sistema',
        status: 'Finalizado - Pendiente de Pago',
        date: new Date().toISOString(),
        amount: total,
        clientId: input.providerId,
        providerId: 'corabo-admin',
        participantIds: [input.providerId, 'corabo-admin'],
        details: {
            system: `Factura de Comisiones - ${monthName} ${input.year}`,
            baseAmount: subtotal,
            tax: iva,
            taxRate: IVA_RATE,
            commissionedTransactionIds: commissionTransactions.map(tx => tx.id),
        },
        lastUpdated: new Date().toISOString(),
    };

    await invoiceRef.set(invoiceTransaction);

    // 4. Update original commission transactions to link them to the master invoice
    const batch = db.batch();
    commissionTransactions.forEach(tx => {
        const txRef = db.collection('transactions').doc(tx.id);
        batch.update(txRef, { 'details.invoiceId': invoiceId, status: 'Resuelto' });
    });
    await batch.commit();

    // 5. Notify the provider
    await sendNotification({
        userId: input.providerId,
        type: 'monthly_invoice',
        title: 'Tu factura mensual está lista',
        message: `El resumen de comisiones de ${monthName} ya está disponible. Total a pagar: $${total.toFixed(2)}.`,
        link: `/payment?commitmentId=${invoiceId}`,
        metadata: {
            invoiceDetails: {
                subtotal,
                iva,
                total,
            }
        }
    });

    console.log(`Invoice ${invoiceId} created for provider ${input.providerId} with a total of $${total.toFixed(2)}.`);
}

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
                console.error(`Attempt ${retries} failed for provider ${doc.id}:`, error.message);
                if (retries >= MAX_RETRIES) {
                    console.error(`All retries failed for provider ${doc.id}. Final error:`, error);
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
        return { success: false, message: `Invoice generation completed with ${errors.length} errors.` };
    }
    
    revalidatePath('/admin');
    return { success: true, message: `Successfully processed invoices for ${processedCount} providers.` };
}
