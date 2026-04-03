import { createClient } from '@supabase/supabase-js'

// Admin client — bypasses RLS. Server-side only. Never import in client code.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)
