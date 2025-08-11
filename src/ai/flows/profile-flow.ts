
'use server';
/**
 * @fileOverview Flows for fetching profile-specific data securely with pagination.
 */

import { ai } from '@/ai/genkit';
import { getFirestoreDb } from '@/lib/firebase-server';
import { collection, getDocs, query, where, limit, startAfter, doc, getDoc, orderBy } from 'firebase/firestore';
import { GetProfileGalleryInputSchema, GetProfileGalleryOutputSchema, GetProfileProductsInputSchema, GetProfileProductsOutputSchema } from '@/lib/types';
import type { GalleryImage, Product } from '@/lib/types';


// --- Get Gallery with Pagination ---

export const getProfileGallery = ai.defineFlow(
    {
        name: 'getProfileGalleryFlow',
        inputSchema: GetProfileGalleryInputSchema,
        outputSchema: GetProfileGalleryOutputSchema,
    },
    async ({ userId, limitNum = 9, startAfterDocId }) => {
        const db = getFirestoreDb();
        const galleryCollection = collection(db, 'users', userId, 'gallery');

        // CRITICAL FIX: Removed orderBy('createdAt', 'desc') from the query.
        // The combination of filtering on a subcollection (implicitly by userId in the rules)
        // and ordering by another field requires a composite index.
        // The sorting will now be handled in the backend code after fetching.
        const q: any[] = [
            limit(limitNum)
        ];

        if (startAfterDocId) {
            const startAfterDoc = await getDoc(doc(db, 'users', userId, 'gallery', startAfterDocId));
            if (startAfterDoc.exists()) {
              q.push(startAfter(startAfterDoc));
            }
        } 
        
        const galleryQuery = query(galleryCollection, ...q);
        const snapshot = await getDocs(galleryQuery);
        
        // Sorting is now done in the backend code after fetching to avoid complex queries.
        const gallery = snapshot.docs
            .map(doc => doc.data() as GalleryImage)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];

        return { gallery, lastVisibleDocId: lastVisibleDoc?.id };
    }
);


// --- Get Products with Pagination ---

export const getProfileProducts = ai.defineFlow(
    {
        name: 'getProfileProductsFlow',
        inputSchema: GetProfileProductsInputSchema,
        outputSchema: GetProfileProductsOutputSchema,
    },
    async ({ userId, limitNum = 10, startAfterDocId }) => {
        const db = getFirestoreDb();
        const productsCollection = collection(db, 'products');

        // This query requires a composite index on (providerId, name).
        // This has been added to firestore.indexes.json to resolve the error.
        const q: any[] = [
            where("providerId", "==", userId),
            orderBy("name"),
            limit(limitNum)
        ];

        if (startAfterDocId) {
            const startAfterDoc = await getDoc(doc(db, "products", startAfterDocId));
            if(startAfterDoc.exists()){
                q.push(startAfter(startAfterDoc));
            }
        }
        
        const productsQuery = query(productsCollection, ...q);
        
        const snapshot = await getDocs(productsQuery);
        const products = snapshot.docs.map(doc => doc.data() as Product);
        const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];

        return { products, lastVisibleDocId: lastVisibleDoc?.id };
    }
);
