
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

        // --- FORENSIC FIX ---
        // The previous queries, even when split, were still too complex (multiple 'where' + 'orderBy')
        // and required a composite index.
        // The definitive solution is to perform the simplest possible query (just by providerId)
        // and then handle all filtering and sorting in the backend code.
        // This removes the need for any manual index creation and resolves the error permanently.
        
        const q = query(
            publicationsCollection,
            where("providerId", "==", userId)
        );

        const snapshot = await getDocs(q);
        
        const allUserContent = snapshot.docs.map(doc => doc.data() as GalleryImage);

        // Filter and sort in the backend
        const galleryItems = allUserContent
            .filter(item => item.type === 'image' || item.type === 'video')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Manual pagination logic
        let paginatedGallery = galleryItems;
        if (startAfterDocId) {
            const startIndex = galleryItems.findIndex(item => item.id === startAfterDocId);
            if (startIndex !== -1) {
                paginatedGallery = galleryItems.slice(startIndex + 1);
            }
        }
        
        const limitedGallery = paginatedGallery.slice(0, limitNum);
        const lastVisibleDoc = limitedGallery.length > 0 ? limitedGallery[limitedGallery.length - 1] : null;

        return { 
            gallery: limitedGallery, 
            lastVisibleDocId: lastVisibleDoc ? lastVisibleDoc.id : undefined 
        };
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
            orderBy('createdAt', 'desc'),
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
        
        const products = snapshot.docs.map(doc => {
                const data = doc.data() as GalleryImage;
                // Transform the GalleryImage data into the Product type
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

        const lastVisibleDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

        return { products, lastVisibleDocId: lastVisibleDoc?.id };
    }
);
