
'use server';
/**
 * @fileOverview Central Genkit configuration.
 *
 * This file configures a Genkit instance. It is important that this file
 * does not directly initialize plugins that have server-side dependencies,
 * such as `googleAI()`, to prevent leaking server code to the client.
 *
 * Plugin initialization should be done within specific flow files that are guaranteed
 * to only run on the server.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [], // This is now safe as we removed the plugin initialization
  model: 'google-ai/gemini-1.5-flash',
});
