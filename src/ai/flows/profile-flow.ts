

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
    async ({ userId, limitNum = 20, startAfterDocId }) => {
        const db = getFirestoreDb();
        const publicationsCollection = collection(db, 'publications');

        // Simple, robust query to get all publications for the user.
        // We will sort and handle pagination logic after fetching to avoid complex index issues.
        const q = query(
            publicationsCollection,
            where("providerId", "==", userId),
            where("type", "in", ["image", "video"])
        );
        
        const snapshot = await getDocs(q);
        
        // Sort on the server to ensure chronological order.
        const gallery = snapshot.docs
            .map(doc => doc.data() as GalleryImage)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Basic pagination logic handled here
        let paginatedGallery = gallery;
        let lastVisibleDocId: string | undefined = undefined;

        if (startAfterDocId) {
            const startIndex = gallery.findIndex(p => p.id === startAfterDocId) + 1;
            paginatedGallery = gallery.slice(startIndex, startIndex + limitNum);
        } else {
            paginatedGallery = gallery.slice(0, limitNum);
        }

        if (paginatedGallery.length > 0 && gallery.indexOf(paginatedGallery[paginatedGallery.length - 1]) + 1 < gallery.length) {
            lastVisibleDocId = paginatedGallery[paginatedGallery.length - 1].id;
        }

        return { gallery: paginatedGallery, lastVisibleDocId };
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
            orderBy('productDetails.name', 'asc'),
            limit(limitNum)
        ];

        if (startAfterDocId) {
            // CRITICAL FIX: The cursor document must also be from the 'publications' collection.
            const startAfterDoc = await getDoc(doc(db, "publications", startAfterDocId));
            if(startAfterDoc.exists()){
                q.push(startAfter(startAfterDoc));
            }
        }
        
        const productsQuery = query(publicationsCollection, ...q);
        
        const snapshot = await getDocs(productsQuery);
        
        const products = snapshot.docs.map(doc => {
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
            });

        const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];

        return { products, lastVisibleDocId: lastVisibleDoc?.id };
    }
);
