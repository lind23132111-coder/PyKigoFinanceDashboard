import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
    const hasPassword = !!process.env.SITE_PASSWORD

    // 1. Bypass authentication if Demo Mode is active OR if no site password is set
    if (isDemo || !hasPassword) {
        return NextResponse.next()
    }

    const { pathname } = request.nextUrl
    const hasAuth = request.cookies.has('site_auth')

    // 2. Allow requests for static files, API routes (except those we want protected), and the login page itself
    if (
        pathname.includes('/_next/') ||
        pathname.includes('/static/') ||
        pathname.includes('/api/') ||
        pathname === '/login' ||
        pathname === '/favicon.ico'
    ) {
        return NextResponse.next()
    }

    // 3. If not authenticated, redirect to the login page
    if (!hasAuth) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

// Config to match all routes except public ones if needed
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
