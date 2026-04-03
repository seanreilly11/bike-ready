import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_premium, stripe_customer_id')
    .eq('id', user.id)
    .single()

  // Already premium — nothing to do
  if (profile?.is_premium) {
    return NextResponse.json({ is_premium: true })
  }

  // No Stripe customer yet — definitely not premium
  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ is_premium: false })
  }

  // Check Stripe directly for a completed payment
  const payments = await stripe.paymentIntents.list({
    customer: profile.stripe_customer_id,
    limit:    5,
  })

  const hasPaid = payments.data.some(p => p.status === 'succeeded')

  if (hasPaid) {
    await supabaseAdmin
      .from('profiles')
      .update({ is_premium: true, premium_since: new Date().toISOString() })
      .eq('id', user.id)
  }

  return NextResponse.json({ is_premium: hasPaid })
}
