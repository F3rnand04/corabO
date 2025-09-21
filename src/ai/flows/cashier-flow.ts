'use server';
/**
 * @fileOverview Flows for managing cashier boxes, QR codes, and cashier sessions.
 */
import { z } from 'zod';
import QRCode from 'qrcode';
import type { CashierBox } from '@/lib/types';

const CreateCashierBoxInputSchema = z.object({
  userId: z.string(),
  name: z.string(),
  password: z.string().min(4).max(6),
});
type CreateCashierBoxInput = z.infer<typeof CreateCashierBoxInputSchema>;


const RegenerateQrInputSchema = z.object({
    userId: z.string(),
    boxId: z.string(),
});
type RegenerateQrInput = z.infer<typeof RegenerateQrInputSchema>;


/**
 * Creates a new cashier box, generates a QR code for it, and returns the box object.
 */
export async function createCashierBoxFlow(input: CreateCashierBoxInput): Promise<CashierBox> {
    const boxId = `caja-${'${Date.now()}'}`;
    const qrValue = JSON.stringify({ providerId: input.userId, cashierBoxId: boxId });

    try {
        const qrDataURL = await QRCode.toDataURL(qrValue, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            margin: 1,
        });

        const newBox: CashierBox = {
            id: boxId,
            name: input.name,
            passwordHash: input.password, // In a real app, hash this password
            qrValue,
            qrDataURL,
        };

        return newBox;
    } catch (err) {
        console.error("Failed to generate QR Data URL in flow", err);
        throw new Error("Could not generate QR code.");
    }
  }



/**
 * Regenerates the QR code for an existing cashier box.
 */
export async function regenerateCashierQrFlow(input: RegenerateQrInput): Promise<{ qrValue: string, qrDataURL: string }> {
    const newQrValue = JSON.stringify({ providerId: input.userId, cashierBoxId: input.boxId, timestamp: Date.now() });
    
    try {
        const newQrDataURL = await QRCode.toDataURL(newQrValue, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            margin: 1,
        });

        return { qrValue: newQrValue, qrDataURL: newQrDataURL };
    } catch (err) {
        console.error("Failed to regenerate QR Data URL in flow", err);
        throw new Error("Could not regenerate QR code.");
    }
  }
