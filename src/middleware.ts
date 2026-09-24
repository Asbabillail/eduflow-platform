import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that do not require authentication
const PUBLIC_ROUTES = ['/login', '/auth/callback', '/auth/confirm']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — MUST be called before any supabase operation
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))

  // Not logged in → redirect to login
  if (!user && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Logged in and hitting login → redirect to app
  if (user && pathname === '/login') {
    const session = await supabase.auth.getSession()
    const jwt = session.data.session?.access_token

    if (jwt) {
      // Decode JWT to get tenant slug
      const payload = JSON.parse(
        Buffer.from(jwt.split('.')[1], 'base64').toString()
      )
      const role = payload.user_role

      if (role === 'super_admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/platform'
        return NextResponse.redirect(url)
      }

      // For tenant users, we need to find their tenant slug
      // We'll redirect to /app and let the layout handle the slug redirect
      const url = request.nextUrl.clone()
      url.pathname = '/app'
      return NextResponse.redirect(url)
    }
  }

  // For tenant routes, verify the user belongs to that tenant
  const tenantMatch = pathname.match(/^\/([^/]+)\/(dashboard|quotations|approvals|settings)/)
  if (tenantMatch && user) {
    const urlTenantSlug = tenantMatch[1]
    const session = await supabase.auth.getSession()
    const jwt = session.data.session?.access_token

    if (jwt) {
      const payload = JSON.parse(
        Buffer.from(jwt.split('.')[1], 'base64').toString()
      )

      // Super admin can access any tenant
      if (payload.user_role === 'super_admin') {
        return supabaseResponse
      }

      // Verify tenant slug matches user's tenant
      // We check against the DB to get the slug for their tenant_id
      const { data: tenant } = await supabase
        .from('tenants')
        .select('slug')
        .eq('id', payload.tenant_id)
        .single()

      if (!tenant || tenant.slug !== urlTenantSlug) {
        // User is trying to access a different school's data
        const url = request.nextUrl.clone()
        url.pathname = '/unauthorized'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
