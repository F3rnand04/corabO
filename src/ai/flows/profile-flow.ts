

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
        const publicationsCollection = collection(db, 'publications');

        // Build the query dynamically
        const q: any[] = [
            where("providerId", "==", userId),
            where("type", "in", ["image", "video"]),
            limit(limitNum)
        ];

        if (startAfterDocId) {
            const startAfterDoc = await getDoc(doc(db, 'publications', startAfterDocId));
            if (startAfterDoc.exists()) {
              q.push(startAfter(startAfterDoc));
            }
        } 
        
        const galleryQuery = query(publicationsCollection, ...q);
        const snapshot = await getDocs(galleryQuery);
        
        // Sort results in the backend to avoid complex indexes
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
        const publicationsCollection = collection(db, 'publications');

        // Build the query dynamically
        const q: any[] = [
            where("providerId", "==", userId),
            where("type", "==", "product"),
            limit(limitNum)
        ];

        if (startAfterDocId) {
            const startAfterDoc = await getDoc(doc(db, "publications", startAfterDocId));
            if(startAfterDoc.exists()){
                q.push(startAfter(startAfterDoc));
            }
        }
        
        const productsQuery = query(publicationsCollection, ...q);
        
        const snapshot = await getDocs(productsQuery);
        
        // Sort results in the backend and map to Product type
        const products = snapshot.docs
            .map(doc => {
                const data = doc.data() as GalleryImage;
                return {
                    id: data.id,
                    name: data.productDetails?.name || 'Producto sin nombre',
                    description: data.description,
                    price: data.productDetails?.price || 0,
                    category: data.productDetails?.category || 'General',
                    providerId: data.providerId,
                    imageUrl: data.src,
                } as Product;
            })
            .sort((a, b) => a.name.localeCompare(b.name));

        const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];

        return { products, lastVisibleDocId: lastVisibleDoc?.id };
    }
);
