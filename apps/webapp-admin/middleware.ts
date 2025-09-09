import { createServerClient, refreshSessionIfNeeded } from '../../packages/auth/src/lib/supabase'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Use the centralized server helper which uses Next's cookie store.
  // The helper is an async factory that reads cookies() itself, so await it.
  const supabase = await createServerClient()

  // Proactively refresh session (best-effort) so we can reliably read user
  await refreshSessionIfNeeded(supabase)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect routes
  const { pathname } = request.nextUrl

  // Redirect unauthenticated users to login
  if (pathname.startsWith('/user/dashboard') || pathname.startsWith('/admin/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/user/login', request.url))
    }
  }

  // Redirect authenticated users away from login page
  if (pathname === '/user/login' && user) {
    return NextResponse.redirect(new URL('/user/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}