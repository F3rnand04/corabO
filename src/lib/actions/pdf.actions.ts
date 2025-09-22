'use server';

import type { Transaction } from '@/lib/types';
import { downloadTransactionsPDFFlow } from '@/ai/flows/pdf-flow';


export async function downloadTransactionsPDF(transactions: Transaction[]): Promise<string> {
    return await downloadTransactionsPDFFlow(transactions);
}
