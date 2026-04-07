import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/learn'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

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
