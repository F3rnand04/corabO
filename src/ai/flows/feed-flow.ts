/**
 * @fileOverview A feed generation flow for fetching publications.
 *
 * - getFeedFlow - A function that fetches publications with pagination.
 */
import { z } from 'zod';
import { getFirestore, type DocumentSnapshot } from 'firebase-admin/firestore';
import type { GalleryImage, User, PublicationOwner } from '@/lib/types';
import { GetFeedInputSchema, GetFeedOutputSchema } from '@/lib/types';


export async function getFeedFlow(input: z.infer<typeof GetFeedInputSchema>): Promise<z.infer<typeof GetFeedOutputSchema>> {
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

        // --- Data Enrichment Step ---
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

            return {
                ...pub,
                owner,
            };
        });

        const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
        const nextCursor: string | undefined = snapshot.docs.length === (input.limitNum || 10) ? lastVisibleDoc?.id : undefined;

        return { 
            publications: enrichedPublications, 
            lastVisibleDocId: nextCursor
        };
}
