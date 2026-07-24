// Billing configured only when both the server API key and the webhook signing
// secret are present. Guards the checkout action and webhook route.
export function isPaddleConfigured(): boolean {
  return !!(process.env.PADDLE_API_KEY && process.env.PADDLE_WEBHOOK_SECRET);
}
