
'use server';
/**
 * @fileOverview An AI-powered document verification flow.
 *
 * - autoVerifyIdWithAIFlow - A function that uses a multimodal model to read an ID document and compare it with user data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';

const VerificationInputSchema = z.object({
  userId: z.string(),
  nameInRecord: z.string(),
  idInRecord: z.string(), // The ID number from the user's record
  documentImageUrl: z.string(),
});

export type VerificationInput = z.infer<typeof VerificationInputSchema>;


const VerificationOutputSchema = z.object({
  extractedName: z.string(),
  extractedId: z.string(),
  nameMatch: z.boolean(),
  idMatch: z.boolean(),
});

export type VerificationOutput = z.infer<typeof VerificationOutputSchema>;

export async function autoVerifyIdWithAI(input: VerificationInput): Promise<VerificationOutput> {
  // The check for the document URL is now implicitly handled by the input schema.
  // If documentImageUrl is missing, Zod will throw an error before this function is even called.
  return autoVerifyIdWithAIFlow(input);
}

const verificationPrompt = ai.definePrompt({
    name: 'idVerificationPrompt',
    input: { schema: VerificationInputSchema },
    output: { 
        schema: z.object({
            extractedName: z.string().describe("The full name of the person on the ID, including all given names and surnames."),
            extractedId: z.string().describe("The full identification number, including any prefix like 'V-'."),
        })
    },
    prompt: `You are an expert document analyst. Analyze the provided image of an identification document.
    Extract the full name and the full identification number exactly as they appear.
    
    Image: {{media url=documentImageUrl}}`,
});


const autoVerifyIdWithAIFlow = ai.defineFlow(
  {
    name: 'autoVerifyIdWithAIFlow',
    inputSchema: VerificationInputSchema,
    outputSchema: VerificationOutputSchema,
  },
  async (input) => {
    
    const { output } = await verificationPrompt({ 
        ...input,
        documentImageUrl: input.documentImageUrl 
    });

    if (!output) {
      throw new Error('AI model did not return an output.');
    }
    
    // 1. Normalize ID numbers for a robust comparison
    // This removes all non-alphanumeric characters and converts to lowercase.
    // e.g., "V 17.001.955" becomes "v17001955"
    // e.g., "V-17001955" also becomes "v17001955"
    const normalizeId = (str: string) => str.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const idMatch = normalizeId(output.extractedId) === normalizeId(input.idInRecord);
    
    // 2. Normalize names for flexible comparison
    const normalizeName = (str: string) => str.trim().toLowerCase();
    
    const extractedNameLower = normalizeName(output.extractedName); // e.g., "fernando antonio infante"
    const recordNameParts = normalizeName(input.nameInRecord).split(' '); // e.g., ["fernando", "infante"]

    // 3. Check if every part of the name from our record is present in the name extracted from the ID
    // This is more flexible. It checks if "fernando" is in "fernando antonio infante" AND if "infante" is in "fernando antonio infante".
    // This will correctly pass.
    const nameMatch = recordNameParts.every(part => extractedNameLower.includes(part));

    return {
      extractedName: output.extractedName,
      extractedId: output.extractedId,
      nameMatch,
      idMatch,
    };
  }
);
