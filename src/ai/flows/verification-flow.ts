/**
 * @fileOverview An AI-powered document verification flow.
 *
 * - autoVerifyIdWithAIFlow - A function that uses a multimodal model to read an ID document and compare it with user data.
 */
import { z } from 'zod';


const VerificationInputSchema = z.object({
  userId: z.string(),
  nameInRecord: z.string(),
  idInRecord: z.string(),
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


export async function autoVerifyIdWithAIFlow(input: VerificationInput): Promise<VerificationOutput> {
    
    // AI functionality is disabled. Returning a placeholder.
    console.warn("Genkit flow 'autoVerifyIdWithAIFlow' is disabled.");

    const nameMatch = compareNamesFlexibly(input.nameInRecord, "Simulated Name");
    const idMatch = normalizeId(input.idInRecord) === normalizeId("000000");

    return {
      extractedName: "Simulated Name from AI",
      extractedId: "V-00.000.000 (Simulated)",
      nameMatch,
      idMatch,
    };
  }
