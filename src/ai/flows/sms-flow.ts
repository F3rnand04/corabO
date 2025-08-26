/**
 * @fileOverview A flow for managing SMS verification codes, including sending the SMS.
 */
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { addMinutes, isAfter } from 'date-fns';
import type { User } from '@/lib/types';
// import { Twilio } from 'twilio';
// import { env } from '@/env.mjs';

const SmsVerificationInputSchema = z.object({
  userId: z.string(),
  phoneNumber: z.string(),
});
type SmsVerificationInput = z.infer<typeof SmsVerificationInputSchema>;

/**
 * Generates a verification code, stores it in Firestore, and sends it via SMS.
 */
export async function sendSmsVerificationCodeFlow(input: SmsVerificationInput) {
    const db = getFirestore();
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const codeExpiry = addMinutes(new Date(), 10); // Code is valid for 10 minutes

    const userRef = db.collection('users').doc(input.userId);
    await userRef.update({
      phone: input.phoneNumber,
      phoneVerificationCode: verificationCode,
      phoneVerificationCodeExpires: codeExpiry.toISOString(),
    });
    
    try {
        console.log(`Simulating SMS to ${input.phoneNumber}: Your code is ${verificationCode}`);
    } catch (error) {
        console.error("Error sending SMS via Twilio in flow:", error);
    }
  }



const VerifySmsCodeInputSchema = z.object({
    userId: z.string(),
    code: z.string(),
});
type VerifySmsCodeInput = z.infer<typeof VerifySmsCodeInputSchema>;


export async function verifySmsCodeFlow(input: VerifySmsCodeInput): Promise<{ success: boolean, message: string }> {
    const db = getFirestore();
    const userRef = db.collection('users').doc(input.userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists()) {
        return { success: false, message: "Usuario no encontrado." };
    }

    const userData: User = userSnap.data() as User;

    if (userData.phoneVerificationCodeExpires && isAfter(new Date(), new Date(userData.phoneVerificationCodeExpires))) {
        return { success: false, message: "El código de verificación ha expirado." };
    }

    if (userData.phoneVerificationCode !== input.code) {
        return { success: false, message: "El código de verificación es incorrecto." };
    }

    await userRef.update({
        phoneValidated: true,
        phoneVerificationCode: null,
        phoneVerificationCodeExpires: null,
    });

    return { success: true, message: "Teléfono validado exitosamente." };
}
