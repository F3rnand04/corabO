// /src/app/api/auth/session/route.ts
import { getAuth } from 'firebase-admin/auth';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import '@/ai/genkit'; // Import for side effects to ensure Firebase is initialized

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      // If no token is provided, we're likely logging out.
      // Clear the session cookie.
      cookies().delete('session');
      return NextResponse.json({ status: 'signedOut' });
    }

    const auth = getAuth();
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    cookies().set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Session API Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
