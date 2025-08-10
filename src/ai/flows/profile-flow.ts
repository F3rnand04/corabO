
'use server';
/**
 * @fileOverview Flows for fetching profile-specific data securely.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestoreDb } from '@/lib/firebase-server';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import type { GalleryImage, Product } from '@/lib/types';

// Define loose schemas for GalleryImage and Product as Zod can't handle circular types easily.
const GalleryImageSchema = z.any();
const ProductSchema = z.any();

export const getProfileGallery = ai.defineFlow(
    {
        name: 'getProfileGalleryFlow',
        inputSchema: z.string(), // userId
        outputSchema: z.array(GalleryImageSchema),
    },
    async (userId) => {
        const db = getFirestoreDb();
        // CRITICAL FIX: Removed orderBy("createdAt", "desc") which requires a composite index
        // that cannot be created from here, causing the permission denied error.
        // Sorting will now be handled on the client-side.
        const galleryQuery = query(
            collection(db, 'users', userId, 'gallery')
        );
        const snapshot = await getDocs(galleryQuery);
        return snapshot.docs.map(doc => doc.data());
    }
);

export const getProfileProducts = ai.defineFlow(
    {
        name: 'getProfileProductsFlow',
        inputSchema: z.string(), // userId (providerId)
        outputSchema: z.array(ProductSchema),
    },
    async (userId) => {
        const db = getFirestoreDb();
        const productsQuery = query(
            collection(db, 'products'),
            where("providerId", "==", userId)
        );
        const snapshot = await getDocs(productsQuery);
        return snapshot.docs.map(doc => doc.data());
    }
);
