
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  // Redirect to the homepage
  const response = NextResponse.redirect(new URL('/', request.url));
  
  // Clear the server-side session cookie
  cookies().delete('session');

  return response;
}
