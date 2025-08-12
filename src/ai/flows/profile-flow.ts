

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
        
        const queryConstraints: any[] = [
            where("providerId", "==", userId),
            orderBy('createdAt', 'desc'),
            limit(limitNum)
        ];

        if (startAfterDocId) {
            const startAfterDoc = await getDoc(doc(db, 'publications', startAfterDocId));
            if(startAfterDoc.exists()) {
                queryConstraints.push(startAfter(startAfterDoc));
            }
        }
        
        const q = query(publicationsCollection, ...queryConstraints);
        const snapshot = await getDocs(q);

        const allUserContent = snapshot.docs.map(doc => doc.data() as GalleryImage);

        // The query now handles ordering, but we still filter by type in code.
        const galleryItems = allUserContent.filter(item => item.type === 'image' || item.type === 'video');

        const lastVisibleDocInPage = snapshot.docs[snapshot.docs.length - 1];

        return { 
            gallery: galleryItems, 
            lastVisibleDocId: lastVisibleDocInPage?.id
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
        
        const queryConstraints: any[] = [
            where("providerId", "==", userId),
            where("type", "==", "product"), // We can filter by type here as it's efficient with the main providerId filter
            orderBy('createdAt', 'desc'),
            limit(limitNum)
        ];

        if (startAfterDocId) {
             const startAfterDoc = await getDoc(doc(db, 'publications', startAfterDocId));
            if(startAfterDoc.exists()) {
                queryConstraints.push(startAfter(startAfterDoc));
            }
        }

        const q = query(publicationsCollection, ...queryConstraints);
        const snapshot = await getDocs(q);

        const userProductsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryImage));
        
        const finalProducts: Product[] = userProductsData.map(data => ({
            id: data.id,
            name: data.productDetails?.name || 'Producto sin nombre',
            description: data.description,
            price: data.productDetails?.price || 0,
            category: data.productDetails?.category || 'General',
            providerId: data.providerId,
            imageUrl: data.src,
        }));
        
        const lastVisibleDocInPage = snapshot.docs[snapshot.docs.length - 1];

        return { 
            products: finalProducts, 
            lastVisibleDocId: lastVisibleDocInPage?.id
        };
    }
);
