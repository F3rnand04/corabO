
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
    input: { schema: VerificationInputSchema },
    output: { schema: VerificationOutputSchema },
    prompt: `
        You are an expert document verification agent. Your task is to extract the full name and ID number from the provided document image.
        Then, you must compare the extracted information with the user's recorded data.

        Document Type: {{{#if isCompany}}}Company Registration Document (RIF, NIT, etc.){{{else}}}Personal ID Card (Cédula, DNI, etc.){{{/if}}}

        Follow these steps:
        1.  Analyze the image: {{media url=documentImageUrl}}
        2.  Extract the full name and the main identification number. Be precise.
        3.  The user's recorded name is: '{{nameInRecord}}'
        4.  The user's recorded ID is: '{{idInRecord}}'
        5.  Compare the extracted name with the recorded name. Set 'nameMatch' to true if they are reasonably similar (e.g., ignoring middle names or suffixes like 'C.A.').
        6.  Compare the extracted ID with the recorded ID. Normalize both IDs by removing prefixes (V, E, J, G), dashes, and dots before comparing. Set 'idMatch' to true if the normalized numbers are identical.
        7.  Return the final JSON object.
    `,
});

export async function autoVerifyIdWithAIFlow(input: VerificationInput): Promise<VerificationOutput> {
    const { output } = await verificationPrompt(input);
    if (!output) {
        throw new Error("AI verification failed to produce an output.");
    }

    // Overwrite the AI's comparison with our more robust backend comparison logic
    const backendNameMatch = compareNamesFlexibly(input.nameInRecord, output.extractedName);
    const backendIdMatch = normalizeId(input.idInRecord) === normalizeId(output.extractedId);

    return {
        ...output,
        nameMatch: backendNameMatch,
        idMatch: backendIdMatch,
    };
}
