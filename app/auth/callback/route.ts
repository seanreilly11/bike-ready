import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_NEXT_PATHS = ['/learn', '/review', '/test', '/checkout']

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/learn'
  const next = ALLOWED_NEXT_PATHS.includes(rawNext) ? rawNext : '/learn'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(new URL('/learn?auth_error=1', request.url))
    }

    if (next === '/checkout') {
      const res = await fetch(`${origin}/api/checkout`, {
        method: 'POST',
        headers: { cookie: request.headers.get('cookie') ?? '' },
      })
      const { url } = (await res.json()) as { url: string }
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.redirect(new URL(next, request.url))
}
