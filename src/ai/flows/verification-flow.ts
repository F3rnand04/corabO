
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
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set.");
    throw new Error("El servicio de verificación IA no está configurado.");
  }
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

// **FIX**: Enhanced name comparison to be more flexible, similar to ID normalization.
function compareNamesFlexibly(nameA: string, nameB: string): boolean {
    const normalize = (name: string) => {
        if (!name) return '';
        return name
            .toLowerCase()
            .trim()
            // Remove common company suffixes like C.A., S.A., etc., globally
            .replace(/\s*c\s*\.\s*a\s*\.?|\s*s\s*\.\s*a\s*\.?|\s*ca\s*|\s*sa\s*/g, '')
            // Remove all punctuation (dots, commas) and spaces
            .replace(/[.,\s]/g, '');
    };

    const normalizedA = normalize(nameA);
    const normalizedB = normalize(nameB);

    return normalizedA === normalizedB;
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
