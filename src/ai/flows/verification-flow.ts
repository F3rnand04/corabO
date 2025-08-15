
'use server';
/**
 * @fileOverview An AI-powered document verification flow.
 *
 * - autoVerifyIdWithAIFlow - A function that uses a multimodal model to read an ID document and compare it with user data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';


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
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set.");
    throw new Error("El servicio de verificación IA no está configurado.");
  }
  return autoVerifyIdWithAIFlow(input);
}

// Levenshtein distance function to calculate similarity between two strings
function levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) {
        matrix[0][i] = i;
    }

    for (let j = 0; j <= b.length; j++) {
        matrix[j][0] = j;
    }

    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1, // deletion
                matrix[j - 1][i] + 1, // insertion
                matrix[j - 1][i - 1] + cost // substitution
            );
        }
    }

    return matrix[b.length][a.length];
}

function calculateNameSimilarity(a: string, b: string): number {
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    if (longer.length === 0) {
        return 1.0;
    }
    return (longer.length - levenshteinDistance(longer, shorter)) / longer.length;
}


const autoVerifyIdWithAIFlow = ai.defineFlow(
  {
    name: 'autoVerifyIdWithAIFlow',
    inputSchema: VerificationInputSchema,
    outputSchema: VerificationOutputSchema,
  },
  async (input) => {
    
    // **FIX**: The `output` schema was removed. We ask the model for plain text and process it manually.
    // This is more reliable than forcing a specific JSON structure which can fail.
    const response = await ai.generate({
        model: 'gemini-1.5-flash',
        prompt: [{
            text: `You are an expert document analyst. Analyze the provided image of an identification document.
            Extract the full name and the full identification number exactly as they appear.
            Provide the output STRICTLY in the following format, with each piece of data on a new line:
            Nombre: [Full Name Here]
            ID: [Full ID Number Here]`
        }, {
            media: {
                url: input.documentImageUrl
            }
        }],
    });
    
    const responseText = response.text;
    if (!responseText) {
        throw new Error('AI model did not return a text response.');
    }
    
    // Manual parsing of the text response
    const nameMatchResult = responseText.match(/Nombre: (.*)/);
    const idMatchResult = responseText.match(/ID: (.*)/);

    const extractedName = nameMatchResult ? nameMatchResult[1].trim() : '';
    const extractedId = idMatchResult ? idMatchResult[1].trim() : '';

    if (!extractedName || !extractedId) {
        throw new Error('AI failed to extract the required fields from the document.');
    }

    const normalizeId = (str: string) => {
        return str
            .trim()
            .toLowerCase()
            .replace(/o/g, '0') // Correct common OCR errors (O -> 0)
            .replace(/^[ve]-?/, "") // Remove V or E prefix
            .replace(/[\s.-]/g, ''); // Remove separators
    };
    
    const idMatch = normalizeId(extractedId) === normalizeId(input.idInRecord);
    
    const normalizeName = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');
    
    const extractedNameLower = normalizeName(extractedName);
    const recordNameLower = normalizeName(input.nameInRecord);

    const nameSimilarity = calculateNameSimilarity(recordNameLower, extractedNameLower);
    const nameMatch = nameSimilarity >= 0.8;

    return {
      extractedName: extractedName,
      extractedId: extractedId,
      nameMatch,
      idMatch,
    };
  }
);
