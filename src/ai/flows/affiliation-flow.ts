
'use server';
/**
 * @fileOverview Flows for managing professional affiliations with companies.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestoreDb } from '@/lib/firebase-server';
import { doc, setDoc, updateDoc, writeBatch, collection, query, where, getDocs, getDoc, FieldValue, deleteField } from 'firebase/firestore';
import type { Affiliation, User } from '@/lib/types';
import { sendNotification } from './notification-flow';

// --- Schemas ---
const AffiliationActionSchema = z.object({
  affiliationId: z.string(),
  actorId: z.string(), // ID of the user performing the action (e.g., company admin)
});

const RequestAffiliationSchema = z.object({
  providerId: z.string(),
  companyId: z.string(),
});

// --- Flows ---

/**
 * A professional requests to be affiliated with a company.
 */
export const requestAffiliation = ai.defineFlow(
  {
    name: 'requestAffiliationFlow',
    inputSchema: RequestAffiliationSchema,
    outputSchema: z.void(),
  },
  async ({ providerId, companyId }) => {
    const db = getFirestoreDb();

    // Check if a pending or approved affiliation already exists
    const q = query(
        collection(db, 'affiliations'),
        where('providerId', '==', providerId),
        where('companyId', '==', companyId),
        where('status', 'in', ['pending', 'approved'])
    );
    const existing = await getDocs(q);
    if (!existing.empty) {
        throw new Error("An affiliation request for this company already exists or has been approved.");
    }
    
    const affiliationId = `affil-${providerId}-${companyId}`;
    const now = new Date().toISOString();
    const newAffiliation: Affiliation = {
      id: affiliationId,
      providerId,
      companyId,
      status: 'pending',
      requestedAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, 'affiliations', affiliationId), newAffiliation);

    // Notify the company
    await sendNotification({
        userId: companyId,
        type: 'affiliation_request',
        title: 'Nueva Solicitud de Asociación',
        message: `El proveedor con ID ${providerId} desea asociarse como talento a tu empresa.`,
        link: `/admin` // Link to the management panel
    });
  }
);


/**
 * A company approves a professional's affiliation request.
 */
export const approveAffiliation = ai.defineFlow(
  {
    name: 'approveAffiliationFlow',
    inputSchema: AffiliationActionSchema,
    outputSchema: z.void(),
  },
  async ({ affiliationId, actorId }) => {
    const db = getFirestoreDb();
    const batch = writeBatch(db);
    const affiliationRef = doc(db, 'affiliations', affiliationId);
    
    // In a real app, you'd get the affiliation doc first to verify the actorId matches the companyId
    
    const providerId = affiliationId.split('-')[1];
    const companyId = affiliationId.split('-')[2];

    const providerRef = doc(db, 'users', providerId);
    const companyRef = doc(db, 'users', companyId);
    const companySnap = await getDoc(companyRef);
    if (!companySnap.exists()) throw new Error("Company not found");
    const companyData = companySnap.data() as User;

    // Update affiliation status
    batch.update(affiliationRef, { status: 'approved', updatedAt: new Date().toISOString() });
    
    // Update provider's profile with denormalized company data
    batch.update(providerRef, {
        'activeAffiliation': {
            companyId: companyData.id,
            companyName: companyData.profileSetupData?.username || companyData.name,
            companyProfileImage: companyData.profileImage,
            companySpecialty: companyData.profileSetupData?.specialty || '',
        }
    });

    await batch.commit();
  }
);

/**
 * A company rejects a professional's affiliation request.
 */
export const rejectAffiliation = ai.defineFlow(
    {
      name: 'rejectAffiliationFlow',
      inputSchema: AffiliationActionSchema,
      outputSchema: z.void(),
    },
    async ({ affiliationId }) => {
        await updateDoc(doc(getFirestoreDb(), 'affiliations', affiliationId), {
            status: 'rejected',
            updatedAt: new Date().toISOString()
        });
    }
);


/**
 * A company revokes an existing affiliation.
 */
export const revokeAffiliation = ai.defineFlow(
  {
    name: 'revokeAffiliationFlow',
    inputSchema: AffiliationActionSchema,
    outputSchema: z.void(),
  },
  async ({ affiliationId, actorId }) => {
     const db = getFirestoreDb();
     const batch = writeBatch(db);

     const affiliationRef = doc(db, 'affiliations', affiliationId);
     const providerId = affiliationId.split('-')[1];
     const providerRef = doc(db, 'users', providerId);
     
     // Update affiliation to revoked
     batch.update(affiliationRef, { status: 'revoked', updatedAt: new Date().toISOString() });
     
     // Remove affiliation from provider's profile using deleteField
     batch.update(providerRef, { activeAffiliation: deleteField() });
     
     await batch.commit();
  }
);
