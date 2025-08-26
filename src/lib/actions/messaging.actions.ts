'use server';

// import { sendMessageFlow, acceptProposalFlow } from '@/ai/flows/message-flow';
import { revalidatePath } from 'next/cache';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { Conversation, Message, Transaction } from '@/lib/types';

const sendMessageFlow = async (data: any) => console.warn("Genkit flow 'sendMessageFlow' is disabled.");
const acceptProposalFlow = async (data: any) => console.warn("Genkit flow 'acceptProposalFlow' is disabled.");


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
    const db = getFirestore();
    const convoRef = db.collection('conversations').doc(input.conversationId);
    const convoSnap = await convoRef.get();

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: input.senderId,
      timestamp: new Date().toISOString(),
      text: input.text || '',
      isProposalAccepted: false,
      isRead: false,
    };

    if (input.proposal) {
      newMessage.type = 'proposal';
      newMessage.proposal = input.proposal;
    } else if (input.location) {
      newMessage.type = 'location';
      newMessage.location = input.location;
    } else {
      newMessage.type = 'text';
    }

    if (convoSnap.exists()) {
      await convoRef.update({
        messages: FieldValue.arrayUnion(newMessage),
        lastUpdated: new Date().toISOString(),
      });
    } else {
      await convoRef.set({
        id: input.conversationId,
        participantIds: [input.senderId, input.recipientId].sort(),
        messages: [newMessage],
        lastUpdated: new Date().toISOString(),
      });
    }
    
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