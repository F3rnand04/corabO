
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // The middleware is currently disabled by returning next() immediately.
  // All auth logic is handled in the AppLayout component.
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [],
}
