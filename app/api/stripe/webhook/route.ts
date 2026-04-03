import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Stripe sends a raw body — disable body parsing so we can verify the signature
export const config = { api: { bodyParser: false } }

export async function POST(request: NextRequest) {
  const body      = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return new NextResponse('Missing signature', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return new NextResponse('Invalid signature', { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session  = event.data.object as Stripe.Checkout.Session
    const userId   = session.metadata?.supabase_user_id

    if (!userId) {
      return new NextResponse('No user id in metadata', { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        is_premium:         true,
        premium_since:      new Date().toISOString(),
        stripe_customer_id: session.customer as string,
        stripe_payment_id:  session.payment_intent as string,
      })
      .eq('id', userId)

    if (error) {
      console.error('Failed to set is_premium:', error)
      return new NextResponse('Database error', { status: 500 })
    }
  }

  return new NextResponse('OK', { status: 200 })
}
