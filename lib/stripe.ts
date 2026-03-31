// Stripe checkout helper — initiates a one-time payment session.
// Only called from client components; Stripe.js loaded on demand.

export async function redirectToCheckout(userId: string) {
  const { loadStripe } = await import('@stripe/stripe-js').catch(() => {
    throw new Error('Failed to load Stripe.js')
  })

  const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')
  if (!stripe) throw new Error('Stripe failed to initialise')

  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })

  if (!res.ok) throw new Error('Failed to create checkout session')
  const { sessionId } = (await res.json()) as { sessionId: string }

  await stripe.redirectToCheckout({ sessionId })
}
