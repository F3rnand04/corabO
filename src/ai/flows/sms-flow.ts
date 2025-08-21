'use server';
/**
 * @fileOverview A flow for managing SMS verification codes, including sending the SMS.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestoreDb } from '@/lib/firebase-server';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { addMinutes, isAfter } from 'date-fns';
import type { User } from '@/lib/types';
import { Twilio } from 'twilio';
import { env } from '@/env.mjs';

const SmsVerificationInputSchema = z.object({
  userId: z.string(),
  phoneNumber: z.string(),
});

/**
 * Generates a verification code, stores it in Firestore, and sends it via SMS.
 */
export const sendSmsVerificationCodeFlow = ai.defineFlow(
  {
    name: 'sendSmsVerificationCodeFlow',
    inputSchema: SmsVerificationInputSchema,
    outputSchema: z.void(),
  },
  async ({ userId, phoneNumber }) => {
    const db = getFirestoreDb();
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const codeExpiry = addMinutes(new Date(), 10); // Code is valid for 10 minutes

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      phone: phoneNumber,
      phoneVerificationCode: verificationCode,
      phoneVerificationCodeExpires: codeExpiry.toISOString(),
    });

    const accountSid = env.TWILIO_ACCOUNT_SID;
    const authToken = env.TWILIO_AUTH_TOKEN;
    const twilioNumber = env.TWILIO_PHONE_NUMBER;
    
    const twilioClient = new Twilio(accountSid, authToken);
    
    try {
        await twilioClient.messages.create({
            body: `Tu código de verificación para Corabo es: ${verificationCode}`,
            from: twilioNumber,
            to: phoneNumber,
        });
    } catch (error) {
        console.error("Error sending SMS via Twilio in flow:", error);
        // Do not re-throw the error to the client, just log it.
        // The client will handle the "pending" state.
    }
  }
);


const VerifySmsCodeInputSchema = z.object({
    userId: z.string(),
    code: z.string(),
});


export const verifySmsCodeFlow = ai.defineFlow(
    {
        name: 'verifySmsCodeFlow',
        inputSchema: VerifySmsCodeInputSchema,
        outputSchema: z.object({ success: z.boolean(), message: z.string() }),
    },
    async ({ userId, code }) => {
        const db = getFirestoreDb();
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return { success: false, message: "Usuario no encontrado." };
        }

        const userData: User = userSnap.data() as User;

        if (userData.phoneVerificationCodeExpires && isAfter(new Date(), new Date(userData.phoneVerificationCodeExpires))) {
            return { success: false, message: "El código de verificación ha expirado." };
        }

        if (userData.phoneVerificationCode !== code) {
            return { success: false, message: "El código de verificación es incorrecto." };
        }

        // Code is correct and not expired. Mark phone as validated.
        await updateDoc(userRef, {
            phoneValidated: true,
            phoneVerificationCode: null, // Clear the code after use
            phoneVerificationCodeExpires: null,
        });

        return { success: true, message: "Teléfono validado exitosamente." };
    }
);
