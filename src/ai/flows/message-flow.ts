
'use server';
/**
 * @fileOverview Message and proposal management flows.
 *
 * - sendMessage - A function that handles sending messages and proposals.
 * - acceptProposal - A function that handles accepting a proposal and creating a transaction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestoreDb } from '@/lib/firebase-server'; // Use server-side firebase
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
    // SECURITY: In a real app, the senderId would be derived from the auth context, not the input.
    // For now, we proceed assuming the input is from a validated client session.
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
      // SECURITY CHECK: Ensure the sender is a participant of the conversation
      const conversation = convoSnap.data() as Conversation;
      if (!conversation.participantIds.includes(input.senderId)) {
        throw new Error("Sender is not a participant of this conversation.");
      }
      await updateDoc(convoRef, {
        messages: arrayUnion(newMessage),
        lastUpdated: new Date().toISOString(),
      });
    } else {
      // Creating a new conversation
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

    // SECURITY CHECK: Ensure the acceptor is a participant and is not the sender
    if (!conversation.participantIds.includes(acceptorId)) {
        throw new Error("Acceptor is not a participant of this conversation.");
    }
    const message = conversation.messages.find(m => m.id === messageId);
    if (!message) throw new Error("Message not found");
    if (message.senderId === acceptorId) throw new Error("Cannot accept your own proposal");

    if (message.type !== 'proposal' || !message.proposal) throw new Error("Message is not a proposal");

    // 1. Mark the proposal as accepted in the conversation
    const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
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
