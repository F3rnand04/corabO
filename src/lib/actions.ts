
'use server';
/**
 * @fileOverview Server Actions for the Corabo application.
 * This file serves as the PRIMARY and SOLE bridge between client-side components and server-side Genkit flows.
 * All functions exported from this file are marked as server actions and will only execute on the server.
 * Client components should ONLY import from this file to interact with the backend.
 */

import { getOrCreateUserFlow, FirebaseUserInput } from '@/ai/flows/auth-flow';
import {
  completeInitialSetupFlow,
  checkIdUniquenessFlow,
  updateUserFlow,
  deleteUserFlow,
  getPublicProfileFlow,
  getProfileGallery as getProfileGalleryFlow,
  getProfileProducts as getProfileProductsFlow,
} from '@/ai/flows/profile-flow';
import {
  createPublication as createPublicationFlow,
  createProduct as createProductFlow,
  addCommentToImage as addCommentToImageFlow,
  removeCommentFromImage as removeCommentFromImageFlow,
  updateGalleryImage as updateGalleryImageFlow,
  removeGalleryImage as removeGalleryImageFlow,
} from '@/ai/flows/publication-flow';
import {
    sendMessage as sendMessageFlow,
    acceptProposal as acceptProposalFlow,
    SendMessageInput,
    AcceptProposalInput,
} from '@/ai/flows/message-flow';
import {
  autoVerifyIdWithAIFlow,
  VerificationInput,
} from '@/ai/flows/verification-flow';
import type { User, ProfileSetupData, Transaction, Product, CartItem, GalleryImage, CreatePublicationInput, CreateProductInput, VerificationOutput } from '@/lib/types';
import { getFirestore, writeBatch, doc, updateDoc, arrayUnion, arrayRemove, increment, setDoc, deleteDoc, getDoc, query, collection, where, getDocs, orderBy, limit, deleteField } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from './firebase-server';

// =================================
// AUTH FLOWS
// =================================
export async function getOrCreateUser(firebaseUser: FirebaseUserInput) {
  return await getOrCreateUserFlow(firebaseUser);
}

export async function completeInitialSetup(
  userId: string,
  data: {
    name: string;
    lastName: string;
    idNumber: string;
    birthDate: string;
    country: string;
    type: 'client' | 'provider' | 'repartidor';
    providerType: 'professional' | 'company';
  }
) {
    return await completeInitialSetupFlow({userId, ...data});
}

// =================================
// USER & PROFILE ACTIONS
// =================================

export async function updateUser(userId: string, updates: Partial<User & { 'profileSetupData.serviceRadius': number }>) {
    return await updateUserFlow({userId, updates});
}

export async function updateFullProfile(userId: string, profileData: ProfileSetupData, userType: User['type']) {
    const updates = { profileSetupData: profileData, type: userType };
    return await updateUserFlow({userId, updates});
}


export async function verifyUserId(userId: string) {
    await updateUserFlow({userId, updates: { idVerificationStatus: 'verified', verified: true }});
}

export async function rejectUserId(userId: string) {
    await updateUserFlow({userId, updates: { idVerificationStatus: 'rejected', verified: false }});
}

export async function toggleUserPause(userId: string, isCurrentlyPaused: boolean) {
    await updateUserFlow({userId, updates: { isPaused: !isCurrentlyPaused }});
}

export async function deleteUser(userId: string) {
    await deleteUserFlow({userId});
}

export async function toggleGps(userId: string) {
    const { firestore } = getFirebaseAdmin();
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const currentStatus = userSnap.data()?.isGpsActive || false;
        await updateDoc(userRef, { isGpsActive: !currentStatus });
    }
}

export async function updateUserProfileImage(userId: string, dataUrl: string) {
    await updateUserFlow({userId, updates: { profileImage: dataUrl }});
}

export async function deactivateTransactions(userId: string) {
    await updateUserFlow({userId, updates: { isTransactionsActive: false }});
}

// =================================
// PUBLICATION & PRODUCT ACTIONS
// =================================

export async function createPublication(data: CreatePublicationInput) {
    await createPublicationFlow(data);
}

export async function createProduct(data: CreateProductInput) {
    await createProductFlow(data);
}

export async function removeGalleryImage(ownerId: string, imageId: string) {
    await removeGalleryImageFlow({ownerId, imageId});
}

export async function updateGalleryImage(data: { ownerId: string; imageId: string; updates: { description?: string; imageDataUri?: string; }; }) {
    await updateGalleryImageFlow(data);
}

export async function addCommentToImage(data: { ownerId: string; imageId: string; commentText: string; author: { id: string; name: string; profileImage: string; }; }) {
    await addCommentToImageFlow(data);
}

export async function removeCommentFromImage(data: { ownerId: string; imageId: string; commentIndex: number; }) {
    await removeCommentFromImageFlow(data);
}

// =================================
// MESSAGE & PROPOSAL ACTIONS
// =================================

export async function sendMessage(input: SendMessageInput) {
  await sendMessageFlow(input);
  // NOTE: We're not using 'await' here. The flow will run, but we don't block.
  // We return the conversationId immediately for client-side navigation.
  return input.conversationId;
}

export async function acceptProposal(conversationId: string, messageId: string, acceptorId: string) {
    await acceptProposalFlow({ conversationId, messageId, acceptorId });
}

export async function markConversationAsRead(conversationId: string) {
    const { firestore } = getFirebaseAdmin();
    const convoRef = doc(firestore, 'conversations', conversationId);
    // This is a simplified "mark as read". A real implementation would be more complex.
    await updateDoc(convoRef, { unreadCount: 0 }); // Assuming an unreadCount field exists
}


// =================================
// TRANSACTION & CART ACTIONS
// =================================

export async function updateCart(userId: string, productId: string, newQuantity: number) {
    const { firestore } = getFirebaseAdmin();
    const cartRef = doc(firestore, 'carts', userId);
    const cartSnap = await getDoc(cartRef);

    if (cartSnap.exists()) {
        const cartData = cartSnap.data();
        const items = (cartData.items || []) as CartItem[];
        const existingItemIndex = items.findIndex(item => item.product.id === productId);

        if (newQuantity > 0) {
            if (existingItemIndex > -1) {
                items[existingItemIndex].quantity = newQuantity;
            } else {
                 // In a real app, you would fetch the full product details here before adding.
                 // For the prototype, we assume the client provides enough data.
                 // This is a major simplification.
                 console.error(`Product ${productId} not found to add to cart. This needs a product fetch.`);
            }
        } else { // newQuantity is 0 or less
            if (existingItemIndex > -1) {
                items.splice(existingItemIndex, 1);
            }
        }
        await updateDoc(cartRef, { items });
    } else if (newQuantity > 0) {
        // Create cart if it doesn't exist. Again, simplifying product data fetching.
         console.error(`Product ${productId} not found to create cart. This needs a product fetch.`);
    }
}

export async function checkout(userId: string, providerId: string, deliveryMethod: string, useCredicora: boolean, recipientInfo?: { name: string; phone: string; }, deliveryAddress?: string) {
   // Placeholder for checkout flow
   console.log('Checkout Action Called:', { userId, providerId, deliveryMethod, useCredicora, recipientInfo, deliveryAddress });
}


// =================================
// QR SESSION ACTIONS
// =================================

export async function startQrSession(clientId: string, providerId: string, cashierBoxId?: string) {
    const { firestore } = getFirebaseAdmin();
    const sessionId = `qrs-${Date.now()}`;
    await setDoc(doc(firestore, 'qr_sessions', sessionId), {
        id: sessionId,
        clientId,
        providerId,
        cashierBoxId: cashierBoxId || null,
        status: 'pendingAmount',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        participantIds: [clientId, providerId],
    });
    return sessionId;
}

// ... other actions will be added here in their respective phases ...

// Placeholder for other actions to be added in future phases
export async function getFeed(params: { limitNum: number }) {
  // Placeholder implementation
  const { firestore } = getFirebaseAdmin();
  const publicationsQuery = query(collection(firestore, 'publications'), orderBy('createdAt', 'desc'), limit(params.limitNum));
  const snapshot = await getDocs(publicationsQuery);
  const publications = snapshot.docs.map(doc => doc.data() as GalleryImage);

  // This is a simplified enrichment. A real implementation would be more robust.
  const enrichedPublications = await Promise.all(publications.map(async (pub) => {
    try {
        const ownerDoc = await getDoc(doc(firestore, 'users', pub.providerId));
        if (ownerDoc.exists()) {
            pub.owner = ownerDoc.data() as User;
        }
    } catch (e) {
        console.warn(`Could not fetch owner for publication ${pub.id}`, e);
        pub.owner = undefined;
    }
    return pub;
  }));

  return { publications: enrichedPublications, lastVisibleDocId: snapshot.docs[snapshot.docs.length - 1]?.id || null };
}

export async function subscribeUser(userId: string, plan: string, amount: number) {
    console.log(`Subscribing ${userId} to ${plan} for $${amount}`);
}

export async function autoVerifyIdWithAI(user: User): Promise<VerificationOutput> {
  const input: VerificationInput = {
    userId: user.id,
    nameInRecord: `${user.name} ${user.lastName || ''}`.trim(),
    idInRecord: user.idNumber || '',
    documentImageUrl: user.idDocumentUrl || '',
    isCompany: user.profileSetupData?.providerType === 'company',
  };
  return await autoVerifyIdWithAIFlow(input);
}


export async function checkIdUniqueness(data: { idNumber: string; country: string; currentUserId: string; }): Promise<boolean> {
  return await checkIdUniquenessFlow(data);
}

// ... other server actions ...
// Keep adding other actions as they are refactored
export async function createAppointmentRequest(data: any) {}
export async function payCommitment(data: any) {}
export async function confirmPaymentReceived(data: any) {}
export async function confirmWorkReceived(data: any) {}
export async function completeWork(data: any) {}
export async function sendQuote(data: any) {}
export async function acceptAppointment(data: any) {}
export async function startDispute(data: any) {}
export async function cancelSystemTransaction(data: any) {}
export async function downloadTransactionsPDF(data: any) {}
export async function retryFindDelivery(data: any) {}
export async function assignOwnDelivery(data: any, data2: any) {}
export async function resolveDeliveryAsPickup(data: any) {}
export async function addCashierBox(data: any, data2: any, data3: any) {}
export async function updateCashierBox(data: any, data2: any, data3: any) {}
export async function removeCashierBox(data: any, data2: any) {}
export async function regenerateCashierBoxQr(data: any, data2: any) {}
export async function requestCashierSession(data: any) {}
export async function activatePromotion(data: any, data2: any) {}
export async function createCampaign(data: any, data2: any) {}
export async function handleClientCopyAndPay(data: any) {}
export async function cancelQrSession(data: any) {}
export async function setQrSessionAmount(data: any, data2: any, data3: any, data4: any, data5: any) {}
export async function confirmMobilePayment(data: any) {}
export async function finalizeQrSession(data: any) {}
export async function sendNewCampaignNotifications(data: any) {}
export async function verifyCampaignPayment(data: any, data2: any) {}
export async function registerSystemPayment(userId: string, concept: string, amount: number, isSubscription: boolean) {}
export async function approveAffiliation(affiliationId: string, actorId: string) {}
export async function rejectAffiliation(affiliationId: string, actorId: string) {}
export async function revokeAffiliation(affiliationId: string, actorId: string) {}
