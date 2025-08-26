'use server';
/**
 * @fileOverview Message and proposal management flows.
 *
 * - sendMessageFlow - A function that handles sending messages and proposals.
 * - acceptProposalFlow - A function that handles accepting a proposal and creating a transaction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { Conversation, Message, Transaction, User, AgreementProposal } from '@/lib/types';

// Schema for sending a message/proposal
const SendMessageInputSchema = z.object({
  conversationId: z.string(),
  senderId: z.string(),
  recipientId: z.string(), // Make recipientId mandatory for reliable conversation creation
  text: z.string().optional(),
  location: z
    .object({
      lat: z.number(),
      lon: z.number(),
    })
    .optional(),
  proposal: z.custom<AgreementProposal>().optional(),
});
export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;

// Schema for accepting a proposal
const AcceptProposalInputSchema = z.object({
  conversationId: z.string(),
  messageId: z.string(),
  acceptorId: z.string(),
});
export type AcceptProposalInput = z.infer<typeof AcceptProposalInputSchema>;

export const sendMessageFlow = ai.defineFlow(
  {
    name: 'sendMessageFlow',
    inputSchema: SendMessageInputSchema,
    outputSchema: z.void(),
  },
  async (input: SendMessageInput) => {
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
      const conversation = convoSnap.data() as Conversation;

      if (!conversation.participantIds?.includes(input.senderId)) {
        throw new Error('Sender is not a participant of this conversation.');
      }
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
  }
);

export const acceptProposalFlow = ai.defineFlow(
  {
    name: 'acceptProposalFlow',
    inputSchema: AcceptProposalInputSchema,
    outputSchema: z.void(),
  },
  async (input: AcceptProposalInput) => {
    const db = getFirestore();
    const batch = db.batch();
    const convoRef = db.collection('conversations').doc(input.conversationId);

    const convoSnap = await convoRef.get();
    if (!convoSnap.exists()) throw new Error('Conversation not found');

    const conversation = convoSnap.data() as Conversation;

    if (!conversation.participantIds.includes(input.acceptorId)) {
      throw new Error(
        'Permission Denied: Acceptor is not a participant of this conversation.'
      );
    }
    const message = conversation.messages.find((m) => m.id === input.messageId);
    if (!message) throw new Error('Message not found');
    if (message.senderId === input.acceptorId) {
      throw new Error('Permission Denied: Cannot accept your own proposal.');
    }

    if (message.type !== 'proposal' || !message.proposal) {
      throw new Error('Message is not a proposal');
    }

    const clientRef = db.collection('users').doc(input.acceptorId);
    const clientSnap = await clientRef.get();
    if (!clientSnap.exists()) throw new Error('Client user data not found.');
    const clientData = clientSnap.data() as User;

    const isClientSubscribed = clientData.isSubscribed === true;
    const initialStatus = isClientSubscribed
      ? 'Acuerdo Aceptado - Pendiente de Ejecución'
      : 'Finalizado - Pendiente de Pago';

    const messageIndex = conversation.messages.findIndex(
      (m) => m.id === input.messageId
    );
    const updatedMessages = [...conversation.messages];
    if(messageIndex > -1) {
      updatedMessages[messageIndex] = { ...message, isProposalAccepted: true };
      batch.update(convoRef, { messages: updatedMessages });
    }

    const providerId = message.senderId;
    const clientId = input.acceptorId;

    const newTransaction: Transaction = {
      id: `txn-prop-${Date.now()}`,
      type: 'Servicio',
      status: initialStatus,
      date: new Date().toISOString(),
      amount: message.proposal.amount,
      clientId: clientId,
      providerId: providerId,
      participantIds: [clientId, providerId].sort(),
      details: {
        serviceName: message.proposal.title,
        proposal: message.proposal,
        paymentMethod:
          message.proposal.acceptsCredicora && message.proposal.amount >= 20
            ? 'credicora'
            : 'direct',
      },
    };

    const txRef = db.collection('transactions').doc(newTransaction.id);
    batch.set(txRef, newTransaction);

    await batch.commit();
  }
);
