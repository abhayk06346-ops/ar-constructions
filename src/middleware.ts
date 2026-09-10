import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Public paths that don't require auth
  const isPublicPath = path === '/' || path === '/login' || path.startsWith('/api/auth');
  
  const session = request.cookies.get('session')?.value;
  
  // Verify token if exists
  let verifiedToken = null;
  if (session) {
    try {
      verifiedToken = await decrypt(session);
    } catch (error) {
      // invalid token
    }
  }

  // Redirect to login if unauthenticated and trying to access private route
  if (!isPublicPath && !verifiedToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to dashboard if authenticated and trying to access login
  if (path === '/login' && verifiedToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json).*)',
  ],
};
