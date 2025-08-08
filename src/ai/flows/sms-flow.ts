
'use server';
/**
 * @fileOverview A flow for sending SMS messages via Twilio.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Twilio } from 'twilio';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { addMinutes } from 'date-fns';

const SmsVerificationInputSchema = z.object({
  userId: z.string(),
  phoneNumber: z.string(),
});

const sendSmsVerificationCodeFlow = ai.defineFlow(
  {
    name: 'sendSmsVerificationCodeFlow',
    inputSchema: SmsVerificationInputSchema,
    outputSchema: z.void(),
  },
  async ({ userId, phoneNumber }) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioNumber) {
      throw new Error('Twilio credentials are not configured in .env');
    }

    const twilioClient = new Twilio(accountSid, authToken);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const codeExpiry = addMinutes(new Date(), 10); // Code is valid for 10 minutes

    try {
      await twilioClient.messages.create({
        body: `Tu código de verificación para Corabo es: ${verificationCode}`,
        from: twilioNumber,
        to: phoneNumber,
      });

      // Store the code and expiry on the user's document for later verification
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        phoneVerificationCode: verificationCode,
        phoneVerificationCodeExpires: codeExpiry.toISOString(),
      });

    } catch (error) {
        console.error("Error sending SMS via Twilio:", error);
        // It's important to throw an error so the frontend knows the operation failed.
        throw new Error("Failed to send verification SMS. Please check server logs.");
    }
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
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return { success: false, message: "User not found." };
        }

        const userData = userSnap.data();
        
        if (userData.phoneVerificationCodeExpires && new Date() > new Date(userData.phoneVerificationCodeExpires)) {
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
