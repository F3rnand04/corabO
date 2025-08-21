
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
  isCompany: z.boolean().optional(),
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
  // This function is now the clean, exported wrapper.
  return autoVerifyIdWithAIFlow(input);
}

// ID normalization logic as per documentation
const normalizeId = (id: string): string => {
    if (!id) return '';
    return id
        .trim()
        .toLowerCase()
        // Common OCR error: 'o' instead of '0'
        .replace(/o/g, '0') 
        // Remove common prefixes for Venezuelan IDs (V, E, J, G)
        .replace(/^[vejg]-?/, "") 
        // Remove all non-digit characters (dots, dashes, spaces)
        .replace(/\D/g, ''); 
};

// **FIX**: Enhanced name comparison to be more flexible, inspired by SequenceMatcher logic.
// This function calculates a similarity index between two strings.
function calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().replace(/\s+/g, '');
    const s2 = str2.toLowerCase().replace(/\s+/g, '');

    if (s1 === s2) return 1.0;
    if (s1.length < 2 || s2.length < 2) return 0.0;

    const getBigrams = (s: string) => {
        const bigrams = new Map<string, number>();
        for (let i = 0; i < s.length - 1; i++) {
            const bigram = s.substring(i, i + 2);
            bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
        }
        return bigrams;
    };

    const bigrams1 = getBigrams(s1);
    const bigrams2 = getBigrams(s2);
    
    const intersectionSize = [...bigrams1.keys()].reduce((acc, key) => {
        if (bigrams2.has(key)) {
            return acc + Math.min(bigrams1.get(key)!, bigrams2.get(key)!);
        }
        return acc;
    }, 0);

    return (2.0 * intersectionSize) / (s1.length + s2.length - 2);
}

function compareNamesFlexibly(nameA: string, nameB: string): boolean {
    const normalizedA = nameA.toLowerCase().replace(/,?\s*(c\s*\.\s*a|s\s*\.\s*a|ca|sa)\s*\.?$/g, '').trim();
    const normalizedB = nameB.toLowerCase().replace(/,?\s*(c\s*\.\s*a|s\s*\.\s*a|ca|sa)\s*\.?$/g, '').trim();
    
    const similarity = calculateSimilarity(normalizedA, normalizedB);
    
    // If similarity is very high (e.g., > 80%), consider it a match.
    return similarity > 0.8;
}


const autoVerifyIdWithAIFlow = ai.defineFlow(
  {
    name: 'autoVerifyIdWithAIFlow',
    inputSchema: VerificationInputSchema,
    outputSchema: VerificationOutputSchema,
  },
  async (input) => {
    
    const promptText = input.isCompany
    ? `You are an expert document analyst. Analyze the provided image of a company registration document (like a RIF).
       Extract the full company name (Razón Social) and the full fiscal identification number (RIF / ID Fiscal) exactly as they appear.
       Provide the output STRICTLY in the following format, with each piece of data on a new line:
       Razón Social: [Full Company Name Here]
       ID Fiscal: [Full ID Number Here]`
    : `You are an expert document analyst. Analyze the provided image of an identification document.
       Extract the full name and the full identification number exactly as they appear.
       Provide the output STRICTLY in the following format, with each piece of data on a new line:
       Nombre: [Full Name Here]
       ID: [Full ID Number Here]`;

    const response = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt: [{
            text: promptText
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
    const nameMatchResult = responseText.match(/(?:Nombre|Razón Social):\s*(.*)/);
    const idMatchResult = responseText.match(/(?:ID|ID Fiscal):\s*(.*)/);

    const extractedName = nameMatchResult ? nameMatchResult[1].trim() : '';
    const extractedId = idMatchResult ? idMatchResult[1].trim() : '';

    if (!extractedName || !extractedId) {
        throw new Error('La IA no pudo extraer los campos necesarios del documento. Por favor, asegúrate de que la imagen sea clara y legible, o solicita una revisión manual.');
    }

    // Apply the flexible and normalized comparison logic
    const idMatch = normalizeId(extractedId) === normalizeId(input.idInRecord);
    const nameMatch = compareNamesFlexibly(input.nameInRecord, extractedName);

    return {
      extractedName: extractedName,
      extractedId: extractedId,
      nameMatch,
      idMatch,
    };
  }
);
