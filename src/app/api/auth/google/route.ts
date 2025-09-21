
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAuth } from '@/lib/firebase-admin';
import { getOrCreateUser } from '@/lib/actions/auth.actions';
import { Auth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

// This entire route is now deprecated as the client-side handles the OAuth popup.
// The session cookie is created via an action called from the client after successful login.
// We will keep the file for now to avoid breaking any potential (though unlikely) references,
// but it will simply redirect to the login page.
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/login', request.url));
}
