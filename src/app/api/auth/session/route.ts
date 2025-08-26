import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdmin } from '@/lib/firebase-server';

export async function POST(request: Request) {
    getFirebaseAdmin(); // Ensure admin app is initialized
    const auth = getAuth();
    
    try {
        const body = await request.json();
        const idToken = body.idToken;

        if (idToken) {
            const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
            const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
            cookies().set('session', sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: true, path: '/' });
            return NextResponse.json({ success: true }, { status: 200 });
        } else {
            // Clearing the cookie on logout
            cookies().delete('session');
            return NextResponse.json({ success: true }, { status: 200 });
        }
    } catch (error) {
        console.error('Session management error:', error);
        return NextResponse.json({ success: false, error: 'Failed to manage session' }, { status: 400 });
    }
}
