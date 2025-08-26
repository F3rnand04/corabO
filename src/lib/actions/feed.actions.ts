'use server';
/*
import { getFeedFlow } from '@/ai/flows/feed-flow';
import { getProfileGalleryFlow, getProfileProductsFlow, getPublicProfileFlow } from '@/ai/flows/profile-flow';
*/
import { GetFeedInputSchema, GetProfileGalleryInputSchema, GetProfileProductsInputSchema } from '@/lib/types';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import type { GalleryImage, User, PublicationOwner } from '@/lib/types';

// Re-implementing getFeedFlow locally since the flow is disabled
async function getFeedFlow(input: z.infer<typeof GetFeedInputSchema>): Promise<z.infer<typeof GetFeedOutputSchema>> {
        const db = getFirestore();
        const publicationsCollection = db.collection('publications');
        
        let q = publicationsCollection.orderBy('createdAt', 'desc').limit(input.limitNum || 10);

        if (input.startAfterDocId) {
            const startAfterDoc = await db.collection('publications').doc(input.startAfterDocId).get();
            if(startAfterDoc.exists) {
                q = q.startAfter(startAfterDoc);
            } else {
                console.warn(`Cursor document with ID ${input.startAfterDocId} not found. Fetching from the beginning.`);
            }
        }
        
        const snapshot = await q.get();
        
        const publicationsData = snapshot.docs.map(doc => doc.data() as GalleryImage);

        const providerIds = [...new Set(publicationsData.map(p => p.providerId).filter(Boolean))];

        const ownersMap = new Map<string, User>();
        if (providerIds.length > 0) {
            const usersQuery = db.collection('users').where('id', 'in', providerIds);
            const ownersSnapshot = await usersQuery.get();
            ownersSnapshot.forEach(doc => {
                const owner = doc.data() as User;
                ownersMap.set(owner.id, owner);
            });
        }
        
        const enrichedPublications = publicationsData.map(pub => {
            const ownerData = ownersMap.get(pub.providerId) || null;
            let owner: PublicationOwner | null = null;
            if (ownerData) {
                owner = {
                    id: ownerData.id,
                    name: ownerData.name,
                    profileImage: ownerData.profileImage,
                    verified: ownerData.verified,
                    isGpsActive: ownerData.isGpsActive,
                    reputation: ownerData.reputation,
                    profileSetupData: {
                        specialty: ownerData.profileSetupData?.specialty,
                        providerType: ownerData.profileSetupData?.providerType,
                        username: ownerData.profileSetupData?.username,
                        primaryCategory: ownerData.profileSetupData?.primaryCategory,
                    },
                    activeAffiliation: ownerData.activeAffiliation || null,
                }
            }
            return { ...pub, owner };
        });

        const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
        const nextCursor: string | undefined = snapshot.docs.length === (input.limitNum || 10) ? lastVisibleDoc?.id : undefined;

        return { publications: enrichedPublications, lastVisibleDocId: nextCursor };
}

export async function getFeed(input: z.infer<typeof GetFeedInputSchema>) {
    return await getFeedFlow(input);
}

export async function getPublicProfile(userId: string) {
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists()) return null;
    const fullUser = userSnap.data() as User;
    // Return only public data
    return {
      id: fullUser.id,
      name: fullUser.name,
      lastName: fullUser.lastName,
      type: fullUser.type,
      profileImage: fullUser.profileImage,
      reputation: fullUser.reputation,
      effectiveness: fullUser.effectiveness,
      verified: fullUser.verified,
      isSubscribed: fullUser.isSubscribed,
      isGpsActive: fullUser.isGpsActive,
      isTransactionsActive: fullUser.isTransactionsActive,
      profileSetupData: fullUser.profileSetupData,
      country: fullUser.country,
      credicoraLevel: fullUser.credicoraLevel,
      credicoraLimit: fullUser.credicoraLimit,
      activeAffiliation: fullUser.activeAffiliation || null,
    };
}

export async function getProfileGallery(input: z.infer<typeof GetProfileGalleryInputSchema>) {
    const { userId, limitNum = 9, startAfterDocId } = input;
    const db = getFirestore();
    const galleryCollection = db.collection('publications');
    let q = galleryCollection
        .where("providerId", "==", userId)
        .where("type", "in", ["image", "video"])
        .orderBy('createdAt', 'desc')
        .limit(limitNum);
    if (startAfterDocId) {
        const startAfterDocSnap = await db.collection('publications').doc(startAfterDocId).get();
        if(startAfterDocSnap.exists) q = q.startAfter(startAfterDocSnap);
    }
    const snapshot = await q.get();
    const galleryItems = snapshot.docs.map(doc => doc.data() as GalleryImage);
    const lastVisibleDocInPage = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = snapshot.docs.length === limitNum ? lastVisibleDocInPage?.id : undefined;
    return { gallery: galleryItems, lastVisibleDocId: nextCursor };
}

export async function getProfileProducts(input: z.infer<typeof GetProfileProductsInputSchema>) {
     const { userId, limitNum = 10, startAfterDocId } = input;
    const db = getFirestore();
    const publicationsCollection = db.collection('publications');
    let q = publicationsCollection
        .where("providerId", "==", userId)
        .where("type", "==", "product")
        .orderBy('createdAt', 'desc')
        .limit(limitNum);
    if (startAfterDocId) {
        const startAfterDocSnap = await db.collection('publications').doc(startAfterDocId).get();
        if(startAfterDocSnap.exists) q = q.startAfter(startAfterDocSnap);
    }
    const snapshot = await q.get();
    const userProductsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryImage));
    const finalProducts = userProductsData.map(data => ({
        id: data.id,
        name: data.productDetails?.name || 'Producto sin nombre',
        description: data.description,
        price: data.productDetails?.price || 0,
        category: data.productDetails?.category || 'General',
        providerId: data.providerId,
        imageUrl: data.src,
    }));
    const lastVisibleDocInPage = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = snapshot.docs.length === limitNum ? lastVisibleDocInPage?.id : undefined;
    return { products: finalProducts, lastVisibleDocId: nextCursor };
}
