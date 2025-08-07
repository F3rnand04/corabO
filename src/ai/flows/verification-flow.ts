
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

const VerificationOutputSchema = z.object({
  extractedName: z.string(),
  extractedId: z.string(),
  nameMatch: z.boolean(),
  idMatch: z.boolean(),
});

export type VerificationOutput = z.infer<typeof VerificationOutputSchema>;

export async function autoVerifyIdWithAI(user: User): Promise<VerificationOutput> {
  if (!user.idDocumentUrl) {
    throw new Error('User does not have an ID document uploaded.');
  }
  // For the demo, we use a placeholder for the ID in record. In a real app, this would come from the user's profile.
  const simulatedIdInRecord = "V-20.123.456";

  return autoVerifyIdWithAIFlow({
      userId: user.id,
      nameInRecord: user.name,
      idInRecord: simulatedIdInRecord, 
      documentImageUrl: user.idDocumentUrl,
  });
}

const verificationPrompt = ai.definePrompt({
    name: 'idVerificationPrompt',
    input: { schema: z.object({ documentImageUrl: z.string() }) },
    output: { 
        schema: z.object({
            fullName: z.string().describe("The full name of the person on the ID, including all given names and surnames."),
            idNumber: z.string().describe("The full identification number, including any prefix like 'V-'."),
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
    
    const { output } = await verificationPrompt({ documentImageUrl: input.documentImageUrl });

    if (!output) {
      throw new Error('AI model did not return an output.');
    }
    
    // Normalize strings for better comparison
    const normalize = (str: string) => str.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    const nameMatch = normalize(output.fullName) === normalize(input.nameInRecord);
    const idMatch = normalize(output.idNumber) === normalize(input.idInRecord);

    return {
      extractedName: output.fullName,
      extractedId: output.idNumber,
      nameMatch,
      idMatch,
    };
  }
);
