import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin

  // Require authentication before creating a session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/learn', request.url))
  }

  const session = await stripe.checkout.sessions.create({
    mode:                 'payment',
    line_items:           [{ price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!, quantity: 1 }],
    success_url:          `${origin}/learn?unlocked=true`,
    cancel_url:           `${origin}/learn`,
    customer_email:       user.email,
    metadata:             { supabase_user_id: user.id },
  })

  return NextResponse.redirect(session.url!)
}
