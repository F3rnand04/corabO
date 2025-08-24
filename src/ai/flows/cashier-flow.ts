
'use server';
/**
 * @fileOverview Flows for managing cashier boxes, QR codes, and cashier sessions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import QRCode from 'qrcode';
import type { CashierBox, User, QrSession } from '@/lib/types';
import { getFirestore } from 'firebase-admin/firestore';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';

const CreateCashierBoxInputSchema = z.object({
  userId: z.string(),
  name: z.string(),
  password: z.string().min(4).max(6),
});

const RegenerateQrInputSchema = z.object({
    userId: z.string(),
    boxId: z.string(),
});

const CashierBoxSchema = z.object({
    id: z.string(),
    name: z.string(),
    passwordHash: z.string(),
    qrValue: z.string(),
    qrDataURL: z.string(),
});

/**
 * Creates a new cashier box, generates a QR code for it, and returns the box object.
 */
export const createCashierBox = ai.defineFlow(
  {
    name: 'createCashierBoxFlow',
    inputSchema: CreateCashierBoxInputSchema,
    outputSchema: CashierBoxSchema,
  },
  async ({ userId, name, password }) => {
    const boxId = `caja-${Date.now()}`;
    const qrValue = JSON.stringify({ providerId: userId, cashierBoxId: boxId });

    try {
        const qrDataURL = await QRCode.toDataURL(qrValue, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.92,
            margin: 1,
        });

        const newBox: CashierBox = {
            id: boxId,
            name,
            passwordHash: password, // In a real app, hash this password
            qrValue,
            qrDataURL,
        };

        return newBox;
    } catch (err) {
        console.error("Failed to generate QR Data URL in flow", err);
        throw new Error("Could not generate QR code.");
    }
  }
);


/**
 * Regenerates the QR code for an existing cashier box.
 */
export const regenerateCashierQr = ai.defineFlow(
  {
    name: 'regenerateCashierQrFlow',
    inputSchema: RegenerateQrInputSchema,
    outputSchema: z.object({ qrValue: z.string(), qrDataURL: z.string() }),
  },
  async ({ userId, boxId }) => {
    const newQrValue = JSON.stringify({ providerId: userId, cashierBoxId: boxId, timestamp: Date.now() });
    
    try {
        const newQrDataURL = await QRCode.toDataURL(newQrValue, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.92,
            margin: 1,
        });

        return { qrValue: newQrValue, qrDataURL: newQrDataURL };
    } catch (err) {
        console.error("Failed to regenerate QR Data URL in flow", err);
        throw new Error("Could not regenerate QR code.");
    }
  }
);
