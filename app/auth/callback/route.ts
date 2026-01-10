import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      const url = new URL(`${origin}/login`)
      url.searchParams.set('error', 'auth_failed')
      return NextResponse.redirect(url)
    }
  }

  // Si hay un redirect en el query param, usarlo
  if (redirect) {
    const redirectPath = decodeURIComponent(redirect)
    return NextResponse.redirect(`${origin}${redirectPath}`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
