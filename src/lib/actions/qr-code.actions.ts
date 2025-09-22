'use server';

import QRCode from "qrcode";

/**
 * Server Action to securely generate a QR code data URL.
 * It calls the underlying flow, ensuring a clean separation between client and server logic.
 */
export async function generateQrCode(text: string): Promise<string> {
    try {
        const dataUrl = await QRCode.toDataURL(text, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            margin: 1,
        });
        return dataUrl;
    } catch (error) {
        console.error(`[ACTION_ERROR] generateQrCode:`, error);
        throw new Error("Failed to generate QR code.");
    }
}
