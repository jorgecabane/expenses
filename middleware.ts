import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rutas públicas (accesibles sin autenticación)
  const publicRoutes = ['/login', '/register', '/auth/callback', '/invite', '/']
  const isPublicRoute = publicRoutes.some((route) => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
  )
  // La raíz es pública
  const isRoot = request.nextUrl.pathname === '/'

  // Si no está autenticado y trata de acceder a una ruta protegida
  if (!user && !isPublicRoute && !isRoot) {
    const url = request.nextUrl.clone()
    // Guardar la URL original como redirect
    const redirectPath = request.nextUrl.pathname + request.nextUrl.search
    url.pathname = '/login'
    url.searchParams.set('redirect', redirectPath)
    return NextResponse.redirect(url)
  }

  // Si está autenticado y trata de acceder a login/register, redirigir al dashboard
  // EXCEPTO: /auth/callback (necesario para OAuth) y /invite (necesario para aceptar invitaciones)
  const authOnlyRoutes = ['/login', '/register']
  const isAuthOnlyRoute = authOnlyRoutes.some((route) => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
  )
  
  if (user && isAuthOnlyRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
