
'use server';
/**
 * @fileOverview A flow for managing SMS verification codes in the database.
 * The actual sending is delegated to a server action to isolate the Twilio SDK.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestoreDb } from '@/lib/firebase-server';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { addMinutes, isAfter } from 'date-fns';
import type { User } from '@/lib/types';
import { sendSms } from '@/lib/actions'; // Import the isolated server action

const SmsVerificationInputSchema = z.object({
  userId: z.string(),
  phoneNumber: z.string(),
});

/**
 * Generates a verification code, stores it in Firestore, and calls a server action to send the SMS.
 */
const sendSmsVerificationCodeFlow = ai.defineFlow(
  {
    name: 'sendSmsVerificationCodeFlow',
    inputSchema: SmsVerificationInputSchema,
    outputSchema: z.void(),
  },
  async ({ userId, phoneNumber }) => {
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const codeExpiry = addMinutes(new Date(), 10); // Code is valid for 10 minutes

    const userRef = doc(getFirestoreDb(), 'users', userId);
    await updateDoc(userRef, {
      phoneVerificationCode: verificationCode,
      phoneVerificationCodeExpires: codeExpiry.toISOString(),
    });

    // Delegate the actual sending to the isolated server action
    await sendSms({
      to: phoneNumber,
      body: `Tu código de verificación para Corabo es: ${verificationCode}`,
    });
  }
);


const VerifySmsCodeInputSchema = z.object({
    userId: z.string(),
    code: z.string(),
});


const verifySmsCodeFlow = ai.defineFlow(
    {
        name: 'verifySmsCodeFlow',
        inputSchema: VerifySmsCodeInputSchema,
        outputSchema: z.object({ success: z.boolean(), message: z.string() }),
    },
    async ({ userId, code }) => {
        const userRef = doc(getFirestoreDb(), 'users', userId);
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


export { sendSmsVerificationCodeFlow, verifySmsCodeFlow };
