
'use server';
/**
 * @fileOverview A feed generation flow for fetching publications.
 *
 * - getFeedFlow - A function that fetches publications with pagination.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestoreDb } from '@/lib/firebase-server';
import { collection, query, orderBy, limit, startAfter, getDocs, doc, getDoc, where } from 'firebase/firestore';
import type { GalleryImage, User } from '@/lib/types';
import { GetFeedInputSchema, GetFeedOutputSchema } from '@/lib/types';

export const getFeedFlow = ai.defineFlow(
    {
        name: 'getFeedFlow',
        inputSchema: GetFeedInputSchema,
        outputSchema: GetFeedOutputSchema,
    },
    async ({ limitNum = 10, startAfterDocId }) => {
        const db = getFirestoreDb();
        const publicationsCollection = collection(db, 'publications');
        
        const queryConstraints: any[] = [
            orderBy('createdAt', 'desc'),
            limit(limitNum)
        ];

        if (startAfterDocId) {
            const startAfterDoc = await getDoc(doc(db, 'publications', startAfterDocId));
            if(startAfterDoc.exists()) {
                queryConstraints.push(startAfter(startAfterDoc));
            } else {
                console.warn(`Cursor document with ID ${startAfterDocId} not found. Fetching from the beginning.`);
            }
        }
        
        const q = query(publicationsCollection, ...queryConstraints);
        const snapshot = await getDocs(q);
        
        const publicationsData = snapshot.docs.map(doc => doc.data() as GalleryImage);

        // --- Data Enrichment Step ---
        // Get all unique provider IDs from the fetched publications
        const providerIds = [...new Set(publicationsData.map(p => p.providerId).filter(Boolean))];

        // Fetch all owner data in a single batch query if there are any providers
        const ownersMap = new Map<string, User>();
        // Firestore 'in' query fails with an empty array. Add a guard clause.
        if (providerIds.length > 0) {
            const usersQuery = query(collection(db, 'users'), where('id', 'in', providerIds));
            const ownersSnapshot = await getDocs(usersQuery);
            ownersSnapshot.forEach(doc => {
                const owner = doc.data() as User;
                ownersMap.set(owner.id, owner);
            });
        }
        
        // Attach owner data to each publication
        const enrichedPublications = publicationsData.map(pub => {
            // If an owner is not found (e.g., deleted user), owner will be null.
            const owner = ownersMap.get(pub.providerId) || null;
            return {
                ...pub,
                // Ensure owner is a plain object, not a class instance, for serialization
                owner: owner ? JSON.parse(JSON.stringify(owner)) : null,
            };
        });

        const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
        const nextCursor = snapshot.docs.length === limitNum ? lastVisibleDoc?.id : null;

        return { 
            publications: enrichedPublications, 
            lastVisibleDocId: nextCursor
        };
    }
);
