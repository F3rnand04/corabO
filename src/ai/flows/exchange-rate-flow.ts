/**
 * @fileOverview Exchange rate management flow.
 *
 * - getExchangeRate - A function that returns the current official exchange rate.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';

const ExchangeRateOutputSchema = z.object({
  rate: z.number(),
});

export type ExchangeRateOutput = z.infer<typeof ExchangeRateOutputSchema>;

// This function is now the public-facing function that uses the cached flow.
export async function getExchangeRate(): Promise<ExchangeRateOutput> {
  // Use Next.js's unstable_cache to cache the result of the flow.
  // The result will be re-fetched at most once every 4 hours (14400 seconds).
  // The cache tag 'exchange-rate' can be used for on-demand revalidation if needed.
  return unstable_cache(
    async () => {
      console.log('Fetching fresh exchange rate...');
      return getExchangeRateFlow();
    },
    ['exchange-rate-cache'],
    {
      revalidate: 14400, // 4 hours
      tags: ['exchange-rate'],
    }
  )();
}

const getExchangeRateFlow = ai.defineFlow(
  {
    name: 'getExchangeRateFlow',
    inputSchema: z.void(),
    outputSchema: ExchangeRateOutputSchema,
  },
  async () => {
    // In a real-world scenario, this flow would contain logic to scrape
    // a financial data API. For this prototype, we return a fixed, realistic value.
    // The caching mechanism is the important part here.
    return { rate: 36.54 };
  }
);
