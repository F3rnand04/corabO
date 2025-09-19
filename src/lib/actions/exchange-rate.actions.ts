'use server';

import { revalidatePath } from 'next/cache';
import { setExchangeRateFlow } from '@/ai/flows/exchange-rate-flow';

/**
 * Server Action to securely set the exchange rate for a country.
 * This acts as a bridge between the admin UI and the server-side flow.
 */
export async function setExchangeRate(countryCode: string, rate: number) {
    try {
        const result = await setExchangeRateFlow(countryCode, rate);
        // Optionally revalidate paths that might display this rate,
        // although unstable_cache has its own revalidation.
        revalidatePath('/admin');
        return result;
    } catch (error: any) {
        console.error("Error in setExchangeRate action:", error);
        throw new Error(error.message || "Failed to set exchange rate.");
    }
}
