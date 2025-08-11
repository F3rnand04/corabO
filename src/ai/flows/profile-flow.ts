'use server';
/**
 * @fileOverview Flows for fetching profile-specific data securely with pagination.
 */

import { ai } from '@/ai/genkit';
import { getFirestoreDb } from '@/lib/firebase-server';
import { collection, getDocs, query, where, limit, startAfter, doc, getDoc, orderBy } from 'firebase/firestore';
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

        // Consulta simple con ordenación por fecha. Eficiente y no requiere índice adicional.
        const q = [
            orderBy('createdAt', 'desc'),
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
        
        const gallery = snapshot.docs.map(doc => doc.data());
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

        // Consulta que filtra por proveedor y ordena por nombre.
        // Esto podría requerir un índice simple en `providerId` y `name`, que Firebase
        // usualmente sugiere crear automáticamente. No es tan complejo como un `array-contains`.
        const q = [
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
        const products = snapshot.docs.map(doc => doc.data());
        const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];

        return { products, lastVisibleDocId: lastVisibleDoc?.id };
    }
);
