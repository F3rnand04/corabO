'use server';

import '@/ai/genkit'; // Import for side effects to ensure Firebase is initialized
import { revalidatePath } from 'next/cache';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { Conversation, Message, Transaction } from '@/lib/types';
import { sendMessageFlow, acceptProposalFlow } from '@/ai/flows/message-flow';


/**
 * Sends a message or proposal to a conversation.
 * It will create the conversation if it doesn't exist.
 */
export async function sendMessage(input: {
  conversationId: string;
  senderId: string;
  recipientId: string;
  text?: string;
  proposal?: any; // Consider creating a Zod schema for this
  location?: { lat: number; lon: number };
}): Promise<string> {
    await sendMessageFlow(input);
    revalidatePath(`/messages/${input.conversationId}`);
    return input.conversationId;
}

/**
 * Marks all messages in a conversation as read for the current user.
 */
export async function markConversationAsRead(conversationId: string) {
    const db = getFirestore();
    const convoRef = db.collection('conversations').doc(conversationId);
    const convoSnap = await convoRef.get();

    if (convoSnap.exists()) {
        const conversation = convoSnap.data() as Conversation;
        const updatedMessages = conversation.messages.map(msg => ({ ...msg, isRead: true }));
        await convoRef.update({ messages: updatedMessages });
        revalidatePath('/messages');
    }
}

/**
 * Accepts a proposal within a conversation, creating a transaction.
 */
export async function acceptProposal(conversationId: string, messageId: string, acceptorId: string) {
    await acceptProposalFlow({ conversationId, messageId, acceptorId });
    revalidatePath(`/messages/${conversationId}`);
    revalidatePath('/transactions');
}
