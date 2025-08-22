
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
import { firebase } from '@genkit-ai/firebase';

// MARKER-B: Isolation Test for genkit.ts
// The plugins array has been temporarily emptied. If the app starts
// successfully with this change, it confirms that one of the plugins
// was causing the critical server failure.
export const ai = genkit({
  plugins: [
    // firebase(),
    // googleAI(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
