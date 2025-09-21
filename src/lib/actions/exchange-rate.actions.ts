
'use server';

import { revalidatePath } from 'next/cache';
import { getExchangeRate } from '@/ai/flows/exchange-rate-flow';

/**
 * Server Action to securely set the exchange rate for a country.
 * This acts as a bridge between the admin UI and the server-side flow.
 */
export async function setExchangeRate(countryCode: string, rate: number) {
    // In a real app, this would call a flow to update the rate in a secure backend/DB.
    // For this prototype, we'll just log it and revalidate.
    console.log(`Setting exchange rate for ${countryCode} to ${rate}`);
    
    // This revalidates the cache for the getExchangeRate flow.
    revalidatePath('/admin', 'page');
    
    return { success: true };
}
