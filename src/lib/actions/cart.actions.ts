'use server';
/**
 * @fileOverview Flow for managing the user's shopping cart.
 */
import { revalidatePath } from 'next/cache';
import { updateCartFlow } from '@/ai/flows/cart-flow';

/**
 * Updates the quantity of a product in the user's active cart.
 * If the new quantity is 0, the item is removed.
 * This action orchestrates the call to the underlying Genkit flow.
 */
export async function updateCart(userId: string, productId: string, newQuantity: number) {
    try {
        await updateCartFlow({ userId, productId, newQuantity });
        // Revalidate the transactions path because carts are a type of transaction
        revalidatePath('/transactions');
        revalidatePath('/profile'); // For product grid cards to update
    } catch (error) {
        console.error(`[ACTION_ERROR] updateCart:`, error);
        // In a real app, you might want to return a structured error object
        // For now, we'll just log it.
        throw new Error("Failed to update cart.");
    }
}
