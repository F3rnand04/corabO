
'use server';
/**
 * @fileOverview Exchange rate management flow.
 *
 * - getExchangeRate - A function that returns the current official exchange rate.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ExchangeRateOutputSchema = z.object({
  rate: z.number(),
});

export type ExchangeRateOutput = z.infer<typeof ExchangeRateOutputSchema>;

export async function getExchangeRate(): Promise<ExchangeRateOutput> {
  return getExchangeRateFlow();
}

const getExchangeRateFlow = ai.defineFlow(
  {
    name: 'getExchangeRateFlow',
    inputSchema: z.void(),
    outputSchema: ExchangeRateOutputSchema,
  },
  async () => {
    // In a real-world scenario, this would make a fetch call to a third-party API.
    // For this prototype, we return a realistic, fixed value.
    // Example: const response = await fetch('https://api.exchangerate-provider.com/v4/latest/USD');
    // const data = await response.json();
    // return { rate: data.rates.VES };
    
    return { rate: 36.54 };
  }
);
