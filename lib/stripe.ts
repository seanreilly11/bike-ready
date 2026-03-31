// Stripe checkout helper — initiates a one-time payment session.
// @stripe/stripe-js is loaded on demand at runtime via CDN.

export async function redirectToCheckout(_userId: string) {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: _userId }),
  })

  if (!res.ok) throw new Error('Failed to create checkout session')
  const { url } = (await res.json()) as { url: string }

  // Redirect to Stripe-hosted checkout page
  window.location.href = url
}
