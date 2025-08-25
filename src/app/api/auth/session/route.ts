
import { type NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-server';
import { cookies } from 'next/headers';

// Set session cookie on login
export async function POST(request: NextRequest) {
  const { idToken } = await request.json();
  // Session expires in 5 days.
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  try {
    const sessionCookie = await getFirebaseAdmin().auth.createSessionCookie(idToken, { expiresIn });
    cookies().set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json({ success: false, error: 'Failed to create session' }, { status: 401 });
  }
}

// Clear session cookie on logout
export async function DELETE() {
  try {
    cookies().delete('session');
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting session cookie:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete session' }, { status: 500 });
  }
}

    