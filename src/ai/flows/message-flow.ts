
'use server';
/**
 * @fileOverview Message and proposal management flows.
 *
 * - sendMessage - A function that handles sending messages and proposals.
 * - acceptProposal - A function that handles accepting a proposal and creating a transaction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestoreDb } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import type { Conversation, Message, Transaction, AgreementProposal, User } from '@/lib/types';

// Schema for sending a message/proposal
const SendMessageInputSchema = z.object({
  conversationId: z.string(),
  senderId: z.string(),
  recipientId: z.string(),
  text: z.string().optional(),
  proposal: z.object({
    title: z.string(),
    description: z.string(),
    amount: z.number(),
    deliveryDate: z.string(),
    acceptsCredicora: z.boolean(),
  }).optional(),
});
export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;

// Schema for accepting a proposal
const AcceptProposalInputSchema = z.object({
  conversationId: z.string(),
  messageId: z.string(),
  acceptorId: z.string(),
});
export type AcceptProposalInput = z.infer<typeof AcceptProposalInputSchema>;


export const sendMessage = ai.defineFlow(
  {
    name: 'sendMessageFlow',
    inputSchema: SendMessageInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const convoRef = doc(getFirestoreDb(), 'conversations', input.conversationId);
    const convoSnap = await getDoc(convoRef);

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: input.senderId,
      timestamp: new Date().toISOString(),
      type: input.proposal ? 'proposal' : 'text',
      text: input.text,
      proposal: input.proposal,
      isProposalAccepted: false,
      isRead: false, // New messages are always unread
    };

    if (convoSnap.exists()) {
      await updateDoc(convoRef, {
        messages: arrayUnion(newMessage),
        lastUpdated: new Date().toISOString(),
      });
    } else {
      await setDoc(convoRef, {
        id: input.conversationId,
        participantIds: [input.senderId, input.recipientId].sort(),
        messages: [newMessage],
        lastUpdated: new Date().toISOString(),
      });
    }
  }
);


export const acceptProposal = ai.defineFlow(
  {
    name: 'acceptProposalFlow',
    inputSchema: AcceptProposalInputSchema,
    outputSchema: z.void(),
  },
  async ({ conversationId, messageId, acceptorId }) => {
    const batch = writeBatch(getFirestoreDb());
    const convoRef = doc(getFirestoreDb(), 'conversations', conversationId);
    
    const convoSnap = await getDoc(convoRef);
    if (!convoSnap.exists()) throw new Error("Conversation not found");
    
    const conversation = convoSnap.data() as Conversation;
    const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) throw new Error("Message not found");
    
    const message = conversation.messages[messageIndex];
    if (message.type !== 'proposal' || !message.proposal) throw new Error("Message is not a proposal");
    if (message.senderId === acceptorId) throw new Error("Cannot accept your own proposal");

    // 1. Mark the proposal as accepted in the conversation
    const updatedMessages = [...conversation.messages];
    updatedMessages[messageIndex] = { ...message, isProposalAccepted: true };
    batch.update(convoRef, { messages: updatedMessages });

    // 2. Create a new transaction based on the proposal
    const providerId = message.senderId;
    const clientId = acceptorId;

    const newTransaction: Transaction = {
      id: `txn-prop-${Date.now()}`,
      type: 'Servicio',
      status: 'Acuerdo Aceptado - Pendiente de Ejecución',
      date: new Date().toISOString(),
      amount: message.proposal.amount,
      clientId: clientId,
      providerId: providerId,
      participantIds: [clientId, providerId].sort(),
      details: {
        serviceName: message.proposal.title,
        proposal: message.proposal,
        paymentMethod: message.proposal.acceptsCredicora && message.proposal.amount >= 20 ? 'credicora' : 'direct',
      },
    };

    const txRef = doc(getFirestoreDb(), 'transactions', newTransaction.id);
    batch.set(txRef, newTransaction);
    
    await batch.commit();
  }
);
