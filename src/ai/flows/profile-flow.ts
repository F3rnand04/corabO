
'use server';
/**
 * @fileOverview Flows for fetching profile-specific data securely.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestoreDb } from '@/lib/firebase-server'; // Use server-side firebase
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
        const galleryQuery = query(
            collection(db, 'users', userId, 'gallery'),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(galleryQuery);
        return snapshot.docs.map(doc => doc.data() as GalleryImage);
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
        return snapshot.docs.map(doc => doc.data() as Product);
    }
);
