'use server';

import { revalidatePath } from 'next/cache';
import { createCashierBoxFlow, regenerateCashierQrFlow } from '@/ai/flows/cashier-flow';
import { sendNotification as sendNotificationFlow } from '@/ai/flows/notification-flow';
import { processDirectPaymentFlow } from '@/ai/flows/transaction-flow';
import { getFirebaseFirestore } from '../firebase-admin';
import type { User } from '@/lib/types';


export async function addCashierBox(userId: string, name: string, password: string) {
  const db = getFirebaseFirestore();
  await createCashierBoxFlow(db, { userId, name, password });
  revalidatePath('/transactions/settings/cashier');
}

export async function removeCashierBox(userId: string, boxId: string) {
  const db = getFirebaseFirestore();
  const userRef = db.collection('users').doc(userId);
  const userSnap = await userRef.get();
  const userData = userSnap.data() as User;
  const existingBoxes = userData?.profileSetupData?.cashierBoxes || [];
  const updatedBoxes = existingBoxes.filter((box: any) => box.id !== boxId);
  await userRef.update({ 'profileSetupData.cashierBoxes': updatedBoxes });
  revalidatePath('/transactions/settings/cashier');
}

export async function updateCashierBox(userId: string, boxId: string, updates: { name?: string; passwordHash?: string }) {
  const db = getFirebaseFirestore();
  const userRef = db.collection('users').doc(userId);
  const userSnap = await userRef.get();
  const userData = userSnap.data() as User;
  const existingBoxes = userData?.profileSetupData?.cashierBoxes || [];
  const boxIndex = existingBoxes.findIndex((box: any) => box.id === boxId);
  if (boxIndex === -1) throw new Error('Cashier box not found');
  
  const updatedBoxes = [...existingBoxes];
  updatedBoxes[boxIndex] = { ...updatedBoxes[boxIndex], ...updates };

  await userRef.update({ 'profileSetupData.cashierBoxes': updatedBoxes });
  revalidatePath('/transactions/settings/cashier');
}


export async function regenerateCashierBoxQr(userId: string, boxId: string) {
    const db = getFirebaseFirestore();
    await regenerateCashierQrFlow(db, { userId, boxId });
    revalidatePath('/transactions/settings/cashier');
}


export async function startQrSession(clientId: string, providerId: string, cashierBoxId?: string, cashierName?: string) {
    const db = getFirebaseFirestore();
    const sessionId = `qrsess-${Date.now()}`;
    const sessionRef = db.collection('qr_sessions').doc(sessionId);

    await sessionRef.set({
        id: sessionId,
        clientId,
        providerId,
        cashierBoxId: cashierBoxId || null,
        cashierName: cashierName || null,
        status: 'pendingAmount',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        participantIds: [clientId, providerId].sort(),
    });

    return sessionId;
}

export async function setQrSessionAmount(sessionId: string, amount: number, initialPayment: number, financedAmount: number, installments: number) {
    const db = getFirebaseFirestore();
    await db.collection('qr_sessions').doc(sessionId).update({
        amount,
        initialPayment,
        financedAmount,
        installments,
        status: 'pendingClientApproval',
        updatedAt: new Date().toISOString(),
    });
}

export async function cancelQrSession(sessionId: string) {
    const db = getFirebaseFirestore();
    await db.collection('qr_sessions').doc(sessionId).update({
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
    });
}

export async function handleClientCopyAndPay(sessionId: string) {
    const db = getFirebaseFirestore();
    await db.collection('qr_sessions').doc(sessionId).update({
        status: 'awaitingPayment',
        updatedAt: new Date().toISOString(),
    });
}

export async function confirmMobilePayment(sessionId: string) {
    const db = getFirebaseFirestore();
    await db.collection('qr_sessions').doc(sessionId).update({
        status: 'pendingVoucherUpload',
        updatedAt: new Date().toISOString(),
    });
}

export async function finalizeQrSession(sessionId: string) {
    const db = getFirebaseFirestore();
    const { transactionId } = await processDirectPaymentFlow(db, { sessionId });
    
    await db.collection('qr_sessions').doc(sessionId).update({
        status: 'completed',
        transactionId: transactionId,
        updatedAt: new Date().toISOString(),
    });

    revalidatePath('/transactions');
}

export async function requestCashierLogin(providerId: string, cashierName: string, cashierBoxId: string) {
    const db = getFirebaseFirestore();
    const requestId = `cashier-req-${Date.now()}`;
    await sendNotificationFlow(db, {
        userId: providerId,
        type: 'cashier_request',
        title: 'Solicitud de Apertura de Caja',
        message: `${cashierName} está solicitando abrir un turno en la caja '${cashierBoxId}'.`,
        link: `/admin/cashier-requests`,
        metadata: { requestId }
    });
    return requestId;
}
