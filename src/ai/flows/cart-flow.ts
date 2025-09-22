'use server';
/**
 * @fileOverview Flow for managing the user's shopping cart.
 */
import { z } from 'zod';
import { type Firestore } from 'firebase-admin/firestore';
import type { CartItem, Product, User } from '@/lib/types';

const UpdateCartInputSchema = z.object({
  userId: z.string(),
  productId: z.string(),
  newQuantity: z.number().int().min(0),
});

type UpdateCartInput = z.infer<typeof UpdateCartInputSchema>;

export async function updateCartFlow(db: Firestore, input: UpdateCartInput): Promise<void> {
    const userRef = db.collection('users').doc(input.userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
        throw new Error('User not found.');
    }

    const userData = userSnap.data() as User;
    const currentCart = userData.cart || [];

    const itemIndex = currentCart.findIndex(item => item.product.id === input.productId);

    if (itemIndex > -1) {
        // Item exists, update or remove
        if (input.newQuantity > 0) {
            currentCart[itemIndex].quantity = input.newQuantity;
        } else {
            currentCart.splice(itemIndex, 1);
        }
    } else if (input.newQuantity > 0) {
        // Item does not exist, add it
        // We need to fetch the product details to add it to the cart
        const productRef = db.collection('publications').doc(input.productId);
        const productSnap = await productRef.get();
        if (!productSnap.exists || productSnap.data()?.type !== 'product') {
            throw new Error('Product not found.');
        }
        const productData = productSnap.data();

        const product: Product = {
            id: productSnap.id,
            name: productData.productDetails?.name || 'Producto sin nombre',
            description: productData.description,
            price: productData.productDetails?.price || 0,
            category: productData.productDetails?.category || 'General',
            providerId: productData.providerId,
            imageUrl: productData.src,
        };

        currentCart.push({ product, quantity: input.newQuantity });
    }

    await userRef.update({ cart: currentCart });
}
