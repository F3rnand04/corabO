'use server';
/**
 * @fileOverview Flows for fetching profile-specific data securely with pagination.
 */

import { ai } from '@/ai/genkit';
import { getFirestoreDb } from '@/lib/firebase-server';
import { collection, getDocs, query, where, limit, startAfter, doc, getDoc } from 'firebase/firestore';
import { GetProfileGalleryInputSchema, GetProfileGalleryOutputSchema, GetProfileProductsInputSchema, GetProfileProductsOutputSchema } from '@/lib/types';

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

        let galleryQuery;
        if (startAfterDocId) {
            const startAfterDoc = await getDoc(doc(db, 'users', userId, 'gallery', startAfterDocId));
            galleryQuery = query(
                galleryCollection,
                startAfter(startAfterDoc),
                limit(limitNum)
            );
        } else {
            galleryQuery = query(
                galleryCollection,
                limit(limitNum)
            );
        }

        const snapshot = await getDocs(galleryQuery);
        const gallery = snapshot.docs.map(doc => doc.data()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

        let productsQuery;
        if (startAfterDocId) {
            const startAfterDoc = await getDoc(doc(db, "products", startAfterDocId));
            productsQuery = query(
                productsCollection,
                where("providerId", "==", userId),
                startAfter(startAfterDoc),
                limit(limitNum)
            );
        } else {
            productsQuery = query(
                productsCollection,
                where("providerId", "==", userId),
                limit(limitNum)
            );
        }
        
        const snapshot = await getDocs(productsQuery);
        const products = snapshot.docs.map(doc => doc.data()).sort((a,b) => a.name.localeCompare(b.name));
        const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];

        return { products, lastVisibleDocId: lastVisibleDoc?.id };
    }
);
