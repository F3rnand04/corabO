
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
  recipientId: z.string().optional(), // Make recipientId optional
  text: z.string().optional(),
  location: z.object({
      lat: z.number(),
      lon: z.number(),
  }).optional(),
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

    // Dynamically build the message object to avoid undefined fields
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: input.senderId,
      timestamp: new Date().toISOString(),
      text: input.text || '', // Ensure text is always a string
      isProposalAccepted: false,
      isRead: false, // New messages are always unread
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
      // SECURITY CHECK: Ensure the sender is a participant of the conversation
      const conversation = convoSnap.data() as Conversation;
      if (!conversation.participantIds || !Array.isArray(conversation.participantIds)) {
        throw new Error("Conversación inválida: faltan los identificadores de los participantes.");
      }
      if (!conversation.participantIds.includes(input.senderId)) {
        throw new Error("Sender is not a participant of this conversation.");
      }
      await updateDoc(convoRef, {
        messages: arrayUnion(newMessage),
        lastUpdated: new Date().toISOString(),
      });
    } else {
      // Creating a new conversation
      if (!input.recipientId) {
        throw new Error("Recipient ID is required for new conversations.");
      }
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
    const db = getFirestoreDb();
    const batch = writeBatch(db);
    const convoRef = doc(db, 'conversations', conversationId);
    
    const convoSnap = await getDoc(convoRef);
    if (!convoSnap.exists()) throw new Error("Conversation not found");
    
    const conversation = convoSnap.data() as Conversation;

    // SECURITY CHECK: Ensure the acceptor is a participant and is not the sender
    if (!conversation.participantIds.includes(acceptorId)) {
        throw new Error("Permission Denied: Acceptor is not a participant of this conversation.");
    }
    const message = conversation.messages.find(m => m.id === messageId);
    if (!message) throw new Error("Message not found");
    if (message.senderId === acceptorId) throw new Error("Permission Denied: Cannot accept your own proposal.");

    if (message.type !== 'proposal' || !message.proposal) throw new Error("Message is not a proposal");

    // --- Business Logic Enhancement ---
    // Fetch the client's data to check their subscription status.
    const clientRef = doc(db, 'users', acceptorId);
    const clientSnap = await getDoc(clientRef);
    if (!clientSnap.exists()) throw new Error("Client user data not found.");
    const clientData = clientSnap.data() as User;

    // Determine the initial transaction status based on the client's subscription.
    const isClientSubscribed = clientData.isSubscribed ?? false;
    const initialStatus = isClientSubscribed
      ? 'Acuerdo Aceptado - Pendiente de Ejecución'
      : 'Finalizado - Pendiente de Pago'; // Requires upfront payment

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
      status: initialStatus, // Use the dynamically determined status
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

    const txRef = doc(db, 'transactions', newTransaction.id);
    batch.set(txRef, newTransaction);
    
    await batch.commit();
  }
);
