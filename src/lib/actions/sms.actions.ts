
'use server';

/**
 * @fileOverview A flow for managing SMS verification codes, including sending the SMS.
 */
import { sendSmsVerificationCodeFlow, verifySmsCodeFlow } from '@/ai/flows/sms-flow';
import { revalidatePath } from 'next/cache';
import { getFirebaseFirestore } from '../firebase-admin';

export async function sendSmsVerificationCode(userId: string, phoneNumber: string) {
    const db = getFirebaseFirestore();
    try {
        await sendSmsVerificationCodeFlow(db, { userId, phoneNumber });
        return { success: true };
    } catch (error) {
        console.error('Error sending SMS verification code:', error);
        return { success: false, error: 'Failed to send code.' };
    }
}

export async function verifySmsCode(userId: string, code: string) {
    const db = getFirebaseFirestore();
    try {
        const result = await verifySmsCodeFlow(db, { userId, code });
        if (result.success) {
            revalidatePath('/contacts');
        }
        return result;
    } catch (error) {
        console.error('Error verifying SMS code:', error);
        return { success: false, message: 'Failed to verify code.' };
    }
}
