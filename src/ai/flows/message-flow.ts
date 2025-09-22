
'use server';
/**
 * @fileOverview Message and proposal management flows.
 *
 * - sendMessageFlow - A function that handles sending messages and proposals.
 * - acceptProposalFlow - A function that handles accepting a proposal and creating a transaction.
 */
import { z } from 'zod';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { Conversation, Message, Transaction, User, AgreementProposal } from '@/lib/types';
import { createTransactionFlow } from './transaction-flow';

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

export async function sendMessageFlow(db: Firestore, input: SendMessageInput) {
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

    if (convoSnap.exists) {
      const conversation = convoSnap.data() as Conversation;

      if (!conversation.participantIds?.includes(input.senderId)) {
        throw new Error('Sender is not a participant of this conversation.');
      }
      await convoRef.update({
        messages: FieldValue.arrayUnion(newMessage),
        lastUpdated: new Date().toISOString(),
      });
    } else {
      // First, get the participant details to store them denormalized
      const senderSnap = await db.collection('users').doc(input.senderId).get();
      const recipientSnap = await db.collection('users').doc(input.recipientId).get();
      
      if(!senderSnap.exists || !recipientSnap.exists) {
          throw new Error('Sender or Recipient not found for new conversation.');
      }
      
      const senderData = senderSnap.data() as User;
      const recipientData = recipientSnap.data() as User;

      await convoRef.set({
        id: input.conversationId,
        participantIds: [input.senderId, input.recipientId].sort(),
        participants: {
          [senderData.id]: {
            name: senderData.name,
            profileImage: senderData.profileImage,
          },
          [recipientData.id]: {
            name: recipientData.name,
            profileImage: recipientData.profileImage,
          },
        },
        messages: [newMessage],
        lastUpdated: new Date().toISOString(),
      });
    }
  }


export async function acceptProposalFlow(db: Firestore, input: AcceptProposalInput): Promise<{ message: Message, conversation: Conversation }> {
    const convoRef = db.collection('conversations').doc(input.conversationId);

    const convoSnap = await convoRef.get();
    if (!convoSnap.exists) throw new Error('Conversation not found');

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

    const messageIndex = conversation.messages.findIndex(
      (m) => m.id === input.messageId
    );
    
    let updatedMessage: Message | null = null;
    let updatedConversation: Conversation | null = null;

    if (messageIndex > -1) {
      const updatedMessages = [...conversation.messages];
      updatedMessages[messageIndex] = { ...message, isProposalAccepted: true };
      
      await convoRef.update({ messages: updatedMessages });
      
      updatedMessage = updatedMessages[messageIndex];
      updatedConversation = { ...conversation, messages: updatedMessages };

    } else {
      throw new Error('Could not find message in conversation array to update.');
    }
    
    // --- Create Transaction ---
    if (!updatedMessage.proposal) throw new Error("Accepted message is not a valid proposal.");

    const clientSnap = await db.collection('users').doc(input.acceptorId).get();
    if (!clientSnap.exists) throw new Error('Client user data not found.');
    const clientData = clientSnap.data() as User;
    
    const isClientSubscribed = clientData.isSubscribed === true;
    const initialStatus = isClientSubscribed
      ? 'Acuerdo Aceptado - Pendiente de Ejecución'
      : 'Finalizado - Pendiente de Pago';

    const providerId = updatedMessage.senderId;
    const clientId = input.acceptorId;

    const newTransactionData: Omit<Transaction, 'id'> = {
      type: 'Servicio',
      status: initialStatus,
      date: new Date().toISOString(),
      amount: updatedMessage.proposal.amount,
      clientId: clientId,
      providerId: providerId,
      participantIds: [clientId, providerId].sort(),
      details: {
        serviceName: updatedMessage.proposal.title,
        proposal: updatedMessage.proposal,
        paymentMethod:
          updatedMessage.proposal.acceptsCredicora && updatedMessage.proposal.amount >= 20
            ? 'credicora'
            : 'direct',
      },
    };
    
    await createTransactionFlow(db, newTransactionData);

    return { 
        message: updatedMessage, 
        conversation: updatedConversation
    };
}
