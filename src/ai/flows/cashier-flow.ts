
'use server';
/**
 * @fileOverview Flows for managing cashier boxes, QR codes, and cashier sessions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import QRCode from 'qrcode';
import type { CashierBox, User, QrSession } from '@/lib/types';
import { getFirestoreDb } from '@/lib/firebase-server';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { sendNotification } from './notification-flow';

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

const RequestCashierSessionInputSchema = z.object({
  businessCoraboId: z.string(),
  cashierName: z.string(),
  cashierBoxId: z.string(),
  password: z.string(),
});

const RequestCashierSessionOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  sessionId: z.string().optional(),
});


/**
 * A cashier requests to start a session for a specific box.
 * This flow verifies the credentials and creates a pending session request.
 */
export const requestCashierSessionFlow = ai.defineFlow(
  {
    name: 'requestCashierSessionFlow',
    inputSchema: RequestCashierSessionInputSchema,
    outputSchema: RequestCashierSessionOutputSchema,
  },
  async ({ businessCoraboId, cashierName, cashierBoxId, password }) => {
    const db = getFirestoreDb();
    
    // 1. Find the business by its Corabo ID
    const businessQuery = query(collection(db, 'users'), where('coraboId', '==', businessCoraboId));
    const businessSnap = await getDocs(businessQuery);

    if (businessSnap.empty) {
      return { success: false, message: "ID de negocio no encontrado." };
    }
    const business = businessSnap.docs[0].data() as User;
    const businessId = business.id;

    // 2. Find the specific cashier box and verify the password
    const box = business.profileSetupData?.cashierBoxes?.find(b => b.id === cashierBoxId);

    if (!box) {
      return { success: false, message: "La caja seleccionada no existe para este negocio." };
    }

    if (box.passwordHash !== password) {
      return { success: false, message: "La contraseña de la caja es incorrecta." };
    }

    // 3. Create a pending session request
    const sessionId = `cashier-req-${Date.now()}`;
    const sessionRequest = {
      id: sessionId,
      businessId,
      cashierName,
      cashierBoxId,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    
    await setDoc(doc(db, 'cashier_sessions', sessionId), sessionRequest);

    // 4. Notify the business owner
    await sendNotification({
        userId: businessId,
        type: 'cashier_request',
        title: 'Solicitud de Apertura de Caja',
        message: `${cashierName} está solicitando abrir la caja "${box.name}".`,
        link: '/admin?tab=user-management', // Future tab for cashier requests
        metadata: {
            requestId: sessionId,
        }
    });

    return { success: true, message: "Solicitud enviada al dueño del negocio.", sessionId };
  }
);


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
