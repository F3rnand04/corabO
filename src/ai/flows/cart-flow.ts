
'use server';
/**
 * @fileOverview Flow for managing the user's shopping cart.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, writeBatch, doc, getDoc } from 'firebase-admin/firestore';
import type { Transaction, CartItem, Product } from '@/lib/types';

const UpdateCartInputSchema = z.object({
  userId: z.string(),
  productId: z.string(),
  newQuantity: z.number().min(0),
});

export const updateCartFlow = ai.defineFlow(
  {
    name: 'updateCartFlow',
    inputSchema: UpdateCartInputSchema,
    outputSchema: z.void(),
  },
  async ({ userId, productId, newQuantity }) => {
    const db = getFirestore();
    const batch = writeBatch(db);

    const productRef = doc(db, 'publications', productId);
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) throw new Error("Product not found");
    
    const productData = productSnap.data();
    if(productData.type !== 'product' || !productData.productDetails) {
        throw new Error("Item is not a valid product.");
    }
    const providerId = productData.providerId;

    const product: Product = {
      id: productId,
      name: productData.productDetails.name,
      description: productData.description,
      price: productData.productDetails.price,
      category: productData.productDetails.category,
      providerId: providerId,
      imageUrl: productData.src,
    };

    // Find an existing active cart transaction for this provider
    const cartCollection = db.collection('transactions');
    const q = cartCollection
        .where('clientId', '==', userId)
        .where('providerId', '==', providerId)
        .where('status', '==', 'Carrito Activo');
        
    const querySnapshot = await q.get();
    let cartTxRef;
    let existingItems: CartItem[] = [];

    if (!querySnapshot.empty) {
        // Use existing cart
        const cartDoc = querySnapshot.docs[0];
        cartTxRef = cartDoc.ref;
        existingItems = cartDoc.data().details?.items || [];
    } else {
        // Create new cart transaction
        const cartId = `cart-${userId}-${providerId}`;
        cartTxRef = doc(db, 'transactions', cartId);
    }
    
    const itemIndex = existingItems.findIndex(item => item.product.id === productId);

    if (newQuantity > 0) {
      if (itemIndex > -1) {
        // Update quantity
        existingItems[itemIndex].quantity = newQuantity;
      } else {
        // Add new item
        existingItems.push({ product, quantity: newQuantity });
      }
    } else {
      if (itemIndex > -1) {
        // Remove item
        existingItems.splice(itemIndex, 1);
      }
    }
    
    const newTotal = existingItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
    
    const cartData: Partial<Transaction> = {
        id: cartTxRef.id,
        clientId: userId,
        providerId: providerId,
        participantIds: [userId, providerId].sort(),
        status: 'Carrito Activo',
        type: 'Compra',
        date: new Date().toISOString(),
        amount: newTotal,
        details: { items: existingItems }
    };
    
    batch.set(cartTxRef, cartData, { merge: true });
    await batch.commit();
  }
);
