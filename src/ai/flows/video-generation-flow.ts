'use server';

/**
 * @fileOverview A simplified video generation flow.
 * This flow ONLY handles the call to the AI model and returns the video URL.
 * All file system operations have been moved to a separate server action.
 */
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'zod';
import {ai} from '@/ai/genkit';

const textToVideoFlow = ai.defineFlow(
  {
    name: 'textToVideoFlow',
    inputSchema: z.string(),
    // The output is now the media URL as a string.
    outputSchema: z.string(),
  },
  async (prompt) => {
    let {operation} = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: prompt,
      config: {
        durationSeconds: 5,
        aspectRatio: '16:9',
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation');
    }

    // Wait until the operation completes.
    while (!operation.done) {
      operation = await ai.checkOperation(operation);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    if (operation.error) {
      throw new Error('failed to generate video: ' + operation.error.message);
    }

    const video = operation.output?.message?.content.find((p) => !!p.media);
    if (!video || !video.media?.url) {
      throw new Error('Failed to find the generated video URL in the operation result.');
    }
    
    // Return the video URL.
    return video.media.url;
  }
);

/**
 * This function will be called from a server action. 
 * It runs the Genkit flow and returns the resulting video URL.
 * @param prompt The text prompt for video generation.
 * @returns A promise that resolves to the video URL string.
 */
export async function generateVideoUrl(prompt: string): Promise<string> {
    return await textToVideoFlow(prompt);
}
