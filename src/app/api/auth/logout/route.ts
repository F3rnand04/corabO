
import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_BASE_URL));
  
  // Clear the custom token cookie
  response.cookies.set({
      name: 'custom-token',
      value: '',
      httpOnly: true,
      path: '/',
      maxAge: -1, // Expire the cookie immediately
  });

  return response;
}
