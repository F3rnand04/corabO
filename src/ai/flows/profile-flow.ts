
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

        // Build the query dynamically.
        // NOTE: A query with `where("type", "in", ...)` and `orderBy` on a different field requires a composite index.
        // To avoid this, we can perform two separate, simpler queries and merge the results.
        // This is a more robust approach that doesn't depend on manually creating indexes in the Firebase console.

        const imagesQuery = query(
            publicationsCollection,
            where("providerId", "==", userId),
            where("type", "==", "image"),
            orderBy('createdAt', 'desc'),
            limit(limitNum)
        );

        const videosQuery = query(
            publicationsCollection,
            where("providerId", "==", userId),
            where("type", "==", "video"),
            orderBy('createdAt', 'desc'),
            limit(limitNum)
        );
        
        // We don't support pagination with this merged approach yet.
        // This implementation will always fetch the first page.
        // A full pagination solution would require more complex cursor management.
        if (startAfterDocId) {
             console.warn("Pagination (startAfter) is not fully supported for combined image/video gallery fetches yet.");
        }

        const [imageSnapshot, videoSnapshot] = await Promise.all([
            getDocs(imagesQuery),
            getDocs(videosQuery),
        ]);
        
        const galleryImages = imageSnapshot.docs.map(doc => doc.data() as GalleryImage);
        const galleryVideos = videoSnapshot.docs.map(doc => doc.data() as GalleryImage);
        
        // Merge and sort results by date
        const combinedGallery = [...galleryImages, ...galleryVideos]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limitNum); // Apply limit after merging

        // For this simplified version, we don't return a `lastVisibleDocId` as it's complex to determine
        // from a merged result set. The UI will currently not support infinite scroll for the gallery.
        return { gallery: combinedGallery, lastVisibleDocId: undefined };
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
