// This file is now a placeholder and will be removed in favor of modular action files.
// All logic has been moved to files like `user.actions.ts`, `transaction.actions.ts`, etc.
// Keeping it temporarily to avoid breaking imports during transition, will be deleted.
'use server';

// You can re-export actions from the new modules here if needed for a smoother transition,
// but the goal is to have components import directly from the specific action modules.

export * from './actions/user.actions';
export * from './actions/publication.actions';
export * from './actions/transaction.actions';
export * from './actions/messaging.actions';
export * from './actions/admin.actions';
export * from './actions/campaign.actions';
export * from './actions/affiliation.actions';
export * from './actions/cashier.actions';
export * from './actions/delivery.actions';
export * from './actions/cart.actions';
