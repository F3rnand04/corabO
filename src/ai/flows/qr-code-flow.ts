'use server';

import { z } from 'zod';
import QRCode from 'qrcode';

const GenerateQrCodeInputSchema = z.object({
  text: z.string(),
});

const GenerateQrCodeOutputSchema = z.object({
  dataUrl: z.string(),
});

/**
 * Generates a QR code image as a data URL from the given text.
 * This flow isolates the 'qrcode' library to the server.
 */
export async function generateQrCodeDataUrlFlow(
  input: z.infer<typeof GenerateQrCodeInputSchema>
): Promise<z.infer<typeof GenerateQrCodeOutputSchema>> {
  try {
    const dataUrl = await QRCode.toDataURL(input.text, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 1,
    });
    return { dataUrl };
  } catch (err) {
    console.error("Failed to generate QR Data URL in flow", err);
    throw new Error("Could not generate QR code.");
  }
}
