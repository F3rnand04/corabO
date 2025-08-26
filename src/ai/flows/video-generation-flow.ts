'use server';

/**
 * @fileOverview A video generation flow.
 */
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'zod';
import {ai} from '@/ai/genkit';
import {genkit} from 'genkit';
import * as fs from 'fs';
import {Readable} from 'stream';
import type {MediaPart} from 'genkit';

const textToVideoFlow = ai.defineFlow(
  {
    name: 'textToVideoFlow',
    inputSchema: z.string(),
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

    // Wait until the operation completes. Note that this may take some time, maybe even up to a minute. Design the UI accordingly.
    while (!operation.done) {
      operation = await ai.checkOperation(operation);
      // Sleep for 5 seconds before checking again.
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    if (operation.error) {
      throw new Error('failed to generate video: ' + operation.error.message);
    }

    const video = operation.output?.message?.content.find((p) => !!p.media);
    if (!video || !video.media) {
      throw new Error('Failed to find the generated video');
    }

    const videoDownloadUrl = video.media.url;
    
    console.log("Video generated, URL (requires API key to download):", videoDownloadUrl);

    return "Video generation process completed. See server logs for URL.";
  }
);
export {textToVideoFlow};