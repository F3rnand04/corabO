
'use server';
/**
 * @fileOverview An AI-powered document verification flow.
 *
 * - autoVerifyIdWithAIFlow - A function that uses a multimodal model to read an ID document and compare it with user data.
 */
import { z } from 'zod';
import { ai } from '@/ai/genkit';


const VerificationInputSchema = z.object({
  userId: z.string(),
  nameInRecord: z.string(),
  idInRecord: z.string(),
  documentImageUrl: z.string(),
  isCompany: z.boolean().optional(),
});

export type VerificationInput = z.infer<typeof VerificationInputSchema>;


const VerificationOutputSchema = z.object({
  extractedName: z.string().describe("The full name of the person or company as it appears on the document."),
  extractedId: z.string().describe("The ID number (cédula, RIF, NIT, etc.) as it appears on the document."),
  nameMatch: z.boolean(),
  idMatch: z.boolean(),
});

export type VerificationOutput = z.infer<typeof VerificationOutputSchema>;


const normalizeId = (id: string): string => {
    if (!id) return '';
    return id
        .trim()
        .toLowerCase()
        .replace(/o/g, '0') 
        .replace(/^[vejg]-?/, "") 
        .replace(/\D/g, ''); 
};

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
    
    return similarity > 0.8;
}

const verificationPrompt = ai.definePrompt({
    name: 'idVerificationPrompt',
    inputSchema: VerificationInputSchema,
    outputSchema: VerificationOutputSchema,
    prompt: `
        You are an expert document verifier. Your task is to extract the full name and ID number from the provided image of a government-issued identification document.
        Then, you must compare the extracted data with the user's registration data.

        Document Image: {{media url=documentImageUrl}}

        User Registration Data:
        - Name: {{{nameInRecord}}}
        - ID: {{{idInRecord}}}
        
        Perform the following steps:
        1.  Carefully analyze the image to find the full name and the main identification number.
        2.  For company documents (like RIF in Venezuela), the name might be at the top and include terms like 'C.A.' or 'S.A.'. Extract the core company name.
        3.  The ID number might have prefixes (like 'V-', 'E-', 'J-') or formatting marks (dots, dashes). Extract the core numerical value.
        4.  Populate the 'extractedName' and 'extractedId' fields with the data you found in the document.
        5.  Compare the extracted data with the user's registration data, being flexible with minor variations, and set 'nameMatch' and 'idMatch' to true or false.
    `,
});

export const autoVerifyIdWithAIFlow = ai.defineFlow(
    {
        name: 'autoVerifyIdWithAIFlow',
        inputSchema: VerificationInputSchema,
        outputSchema: VerificationOutputSchema,
    },
    async (input) => {
        const llmResponse = await verificationPrompt.generate({
            input: input,
            model: 'googleai/gemini-1.5-flash',
            output: { schema: VerificationOutputSchema },
            config: { temperature: 0.1 },
        });
        
        const output = llmResponse.output()!;

        // Post-processing and fuzzy matching logic
        const extractedIdNormalized = normalizeId(output.extractedId);
        const recordIdNormalized = normalizeId(input.idInRecord);

        const idMatches = extractedIdNormalized === recordIdNormalized;
        const nameMatches = compareNamesFlexibly(output.extractedName, input.nameInRecord);

        return {
            ...output,
            idMatch: idMatches,
            nameMatch: nameMatches,
        };
    }
);
