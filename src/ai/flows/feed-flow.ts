
'use server';
/**
 * @fileOverview A flow for fetching the main feed content securely.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestoreDb } from '@/lib/firebase-server';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { GalleryImage } from '@/lib/types';

// Use z.any() for complex, nested, or circular types to avoid Zod errors.
const PublicationSchema = z.any();

export const getFeed = ai.defineFlow(
    {
        name: 'getFeedFlow',
        inputSchema: z.void(),
        outputSchema: z.array(PublicationSchema), // Output an array of publications
    },
    async () => {
        const db = getFirestoreDb();
        // This query runs on the server, where it has permissions to read the publications collection.
        // It's safe because Firestore rules can be set to only allow server-side reads on this.
        const publicationsQuery = query(
            collection(db, "publications"),
            orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(publicationsQuery);
        if (querySnapshot.empty) {
            return [];
        }

        const publications = querySnapshot.docs.map(doc => doc.data() as GalleryImage);
        
        return publications;
    }
);
