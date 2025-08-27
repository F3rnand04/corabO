'use server';

import '@/ai/genkit'; // Import for side effects to ensure Firebase is initialized
import { sendSmsVerificationCodeFlow, verifySmsCodeFlow } from '@/ai/flows/sms-flow';

export async function sendSmsVerificationCode(userId: string, phoneNumber: string) {
    try {
        await sendSmsVerificationCodeFlow({ userId, phoneNumber });
        return { success: true };
    } catch (error) {
        console.error('Error sending SMS verification code:', error);
        return { success: false, error: 'Failed to send code.' };
    }
}

export async function verifySmsCode(userId: string, code: string) {
    try {
        const result = await verifySmsCodeFlow({ userId, code });
        return result;
    } catch (error) {
        console.error('Error verifying SMS code:', error);
        return { success: false, message: 'Failed to verify code.' };
    }
}
