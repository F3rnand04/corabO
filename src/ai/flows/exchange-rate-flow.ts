
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
    // In a real-world scenario, this flow would contain logic to scrape
    // https://www.bcv.org.ve/ or call a third-party financial data API.
    // This flow would be triggered by a scheduled job (cron) once daily at 9 AM.
    // For this prototype, we return a fixed, realistic value.
    
    return { rate: 36.54 };
  }
);
