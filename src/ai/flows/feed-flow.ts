
'use server';
/**
 * @fileOverview A flow for fetching the main feed content securely.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestoreDb } from '@/lib/firebase-server';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import type { User, GalleryImage } from '@/lib/types';

// Use z.any() for complex, nested, or circular types to avoid Zod errors.
const FeedItemSchema = z.object({
    publication: z.any(),
    owner: z.any(),
});

const FeedOutputSchema = z.array(FeedItemSchema);

export const getFeed = ai.defineFlow(
    {
        name: 'getFeedFlow',
        inputSchema: z.void(),
        outputSchema: FeedOutputSchema,
    },
    async () => {
        const db = getFirestoreDb();
        const publicationsQuery = query(
            collection(db, "publications"),
            orderBy("createdAt", "desc"),
            limit(50)
        );

        const querySnapshot = await getDocs(publicationsQuery);
        if (querySnapshot.empty) {
            return [];
        }

        const publications = querySnapshot.docs.map(doc => doc.data() as GalleryImage);
        
        const ownerIds = [...new Set(publications.map(p => p.providerId))];
        const ownerPromises = ownerIds.map(id => getDoc(doc(db, 'users', id)));
        const ownerSnapshots = await Promise.all(ownerPromises);
        
        const ownersMap = new Map<string, User>();
        ownerSnapshots.forEach(snap => {
            if (snap.exists()) {
                ownersMap.set(snap.id, snap.data() as User);
            }
        });

        const feedItems = publications.map(pub => {
            const owner = ownersMap.get(pub.providerId);
            if (owner && !owner.isPaused) {
                return { publication: pub, owner };
            }
            return null;
        }).filter(item => item !== null);

        return feedItems as any;
    }
);
