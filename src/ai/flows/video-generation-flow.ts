/**
 * @fileOverview A basic, client-safe Genkit flow for video generation.
 * This flow is designed to be imported by server actions and does not contain
 * any Node.js-specific code to prevent build errors.
 */
'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

// Define the input schema for the video generation flow
const GenerateVideoInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate the video from.'),
  durationSeconds: z.number().optional().default(5),
});
export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

/**
 * Defines a Genkit flow that generates a video using the Veo model.
 * This flow is designed to be called from a server action.
 */
export const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: GenerateVideoInputSchema,
    outputSchema: z.string(), // The flow will output the video URL as a string
  },
  async (input) => {
    let { operation } = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: input.prompt,
      config: {
        durationSeconds: input.durationSeconds,
        aspectRatio: '16:9',
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation');
    }

    // Poll for the operation to complete.
    while (!operation.done) {
      console.log('Checking video generation status...');
      await new Promise((resolve) => setTimeout(resolve, 5000));
      operation = await ai.checkOperation(operation);
    }

    if (operation.error) {
      throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const videoPart = operation.output?.message?.content.find((p) => !!p.media);
    if (!videoPart || !videoPart.media?.url) {
      throw new Error('Generated video URL not found in the operation output.');
    }
    
    // The flow's responsibility ends here, returning the URL.
    // The server action that calls this flow will handle the download.
    return videoPart.media.url;
  }
);
