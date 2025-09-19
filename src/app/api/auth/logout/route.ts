
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const response = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_BASE_URL));
  
  // Clear the server-side session cookie
  cookies().delete('session');

  return response;
}
