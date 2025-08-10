
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

export const getFeed = ai.defineFlow(
    {
        name: 'getFeedFlow',
        inputSchema: z.void(),
        outputSchema: z.array(z.any()), // Output an array of users
    },
    async () => {
        const db = getFirestoreDb();
        // This query runs on the server, where it has permissions to read the users collection.
        const usersQuery = query(
            collection(db, "users"),
            where("type", "==", "provider"),
            where("isPaused", "==", false)
        );

        const querySnapshot = await getDocs(usersQuery);
        if (querySnapshot.empty) {
            return [];
        }

        const users = querySnapshot.docs.map(doc => doc.data() as User);
        
        return users;
    }
);
