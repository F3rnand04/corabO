'use server';
/**
 * @fileOverview Flows for managing professional affiliations with companies.
 */
import { z } from 'zod';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { Affiliation, User } from '@/lib/types';
// DO NOT import sendNotification from notification-flow here to avoid circular dependencies.
// The notification logic will be orchestrated by the action layer.

// --- Schemas ---
const AffiliationActionSchema = z.object({
  affiliationId: z.string(),
  actorId: z.string(), // ID of the user performing the action (e.g., company admin)
});
export type AffiliationActionInput = z.infer<typeof AffiliationActionSchema>;


const RequestAffiliationSchema = z.object({
  providerId: z.string(),
  companyId: z.string(),
});
export type RequestAffiliationInput = z.infer<typeof RequestAffiliationSchema>;

// --- Flows ---

/**
 * A professional requests to be affiliated with a company.
 * This flow is now only responsible for creating the affiliation document.
 */
export async function requestAffiliationFlow (input: RequestAffiliationInput) {
    const db = getFirestore();

    // Check if a pending or approved affiliation already exists
    const q = db.collection('affiliations')
        .where('providerId', '==', input.providerId)
        .where('companyId', '==', input.companyId)
        .where('status', 'in', ['pending', 'approved']);
        
    const existing = await q.get();

    if (!existing.empty) {
        throw new Error("An affiliation request for this company already exists or has been approved.");
    }
    
    const affiliationId = `affil-${'${input.providerId}'}-${'${input.companyId}'}`;
    const now = new Date().toISOString();
    const newAffiliation: Affiliation = {
      id: affiliationId,
      providerId: input.providerId,
      companyId: input.companyId,
      status: 'pending',
      requestedAt: now,
      updatedAt: now,
    };
    await db.collection('affiliations').doc(affiliationId).set(newAffiliation);
  }



/**
 * A company approves a professional's affiliation request.
 */
export async function approveAffiliationFlow(input: AffiliationActionInput) {
    const db = getFirestore();
    const batch = db.batch();
    const affiliationRef = db.collection('affiliations').doc(input.affiliationId);
    
    // In a real app, you'd get the affiliation doc first to verify the actorId matches the companyId
    
    const providerId = input.affiliationId.split('-')[1]; // Assuming the format is 'affil-providerId-companyId'
    const companyId = input.affiliationId.split('-')[2];

    const providerRef = db.collection('users').doc(providerId);
    const companyRef = db.collection('users').doc(companyId);
    const companySnap = await companyRef.get();
    if (!companySnap.exists) throw new Error("Company not found");
    const companyData = companySnap.data() as User;

    // Update affiliation status
    batch.update(affiliationRef, { status: 'approved', updatedAt: FieldValue.serverTimestamp() });
    
    // Update provider's profile with denormalized company data
    batch.update(providerRef, {
        activeAffiliation: {
            companyId: companyData.id,
            companyName: companyData.profileSetupData?.username || companyData.name,
            companyProfileImage: companyData.profileImage,
            companySpecialty: companyData.profileSetupData?.specialty || '',
        }
    });

    await batch.commit();
  }


/**
 * A company rejects a professional's affiliation request.
 */
export async function rejectAffiliationFlow(input: AffiliationActionInput) {
    const db = getFirestore();
    await db.collection('affiliations').doc(input.affiliationId).update({
        status: 'rejected',
        updatedAt: FieldValue.serverTimestamp()
    });
}


/**
 * A company revokes an existing affiliation.
 */
export async function revokeAffiliationFlow(input: AffiliationActionInput) {
     const db = getFirestore();
     const batch = db.batch();

     const affiliationRef = db.collection('affiliations').doc(input.affiliationId);
     const providerId = input.affiliationId.split('-')[1];
     const providerRef = db.collection('users').doc(providerId);
     
     // Update affiliation to revoked
     batch.update(affiliationRef, { status: 'revoked', updatedAt: FieldValue.serverTimestamp() });
     
     // Remove affiliation from provider's profile using deleteField
     batch.update(providerRef, { activeAffiliation: FieldValue.delete() });
     
     await batch.commit();
  }
