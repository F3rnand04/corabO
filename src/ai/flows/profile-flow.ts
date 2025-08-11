
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

        // --- CLEANUP & FIX ---
        // The previous complex query is replaced with a simple one.
        // All filtering and sorting is now done in the backend code below.
        
        const q = query(publicationsCollection, where("providerId", "==", userId));
        const snapshot = await getDocs(q);

        const allUserContent = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryImage));
        
        // Filter for products and sort by date in the backend
        const userProducts = allUserContent
            .filter(item => item.type === 'product')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Manual pagination logic
        let paginatedProducts = userProducts;
        let lastVisibleDocId: string | undefined = undefined;

        if (startAfterDocId) {
            const startIndex = userProducts.findIndex(item => item.id === startAfterDocId);
            if (startIndex !== -1) {
                paginatedProducts = userProducts.slice(startIndex + 1);
            }
        }
        
        const limitedProductsRaw = paginatedProducts.slice(0, limitNum);

        if (limitedProductsRaw.length > 0) {
            const lastDocInPage = limitedProductsRaw[limitedProductsRaw.length - 1];
            // Check if there are more items after the last one on this page
            const overallLastItem = userProducts[userProducts.length - 1];
            if (lastDocInPage.id !== overallLastItem.id) {
                lastVisibleDocId = lastDocInPage.id;
            }
        }

        const finalProducts: Product[] = limitedProductsRaw.map(data => ({
            id: data.id,
            name: data.productDetails?.name || 'Producto sin nombre',
            description: data.description,
            price: data.productDetails?.price || 0,
            category: data.productDetails?.category || 'General',
            providerId: data.providerId,
            imageUrl: data.src,
        }));

        return { products: finalProducts, lastVisibleDocId };
    }
);
