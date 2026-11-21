import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { applyRefund, failPayment, recordAttemptFailure, settleCheckoutSession } from '@/lib/stripe-settle'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe webhooks are not configured' }, { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  const rawBody = await request.text()
  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error: dupe } = await admin.from('stripe_events').insert({ id: event.id, type: event.type })
  if (dupe?.code === '23505') return NextResponse.json({ received: true, duplicate: true })
  if (dupe) return NextResponse.json({ error: 'Storage unavailable' }, { status: 500 })

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
      case 'checkout.session.expired':
        await settleCheckoutSession(admin, event.data.object)
        break
      case 'checkout.session.async_payment_failed':
        await failPayment(admin, { sessionId: event.data.object.id }, 'The bank declined or reversed the payment')
        break
      case 'payment_intent.payment_failed': {
        const pi = event.data.object
        const sessions = await getStripe().checkout.sessions.list({ payment_intent: pi.id, limit: 1 })
        await recordAttemptFailure(admin, pi.id, sessions.data[0]?.id ?? null, pi.last_payment_error?.message ?? 'Payment failed')
        break
      }
      case 'charge.refunded':
        await applyRefund(admin, event.data.object)
        break
    }
  } catch (err) {
    // Release the event id so Stripe's retry is processed instead of being treated as a duplicate.
    await admin.from('stripe_events').delete().eq('id', event.id)
    console.error('Stripe webhook handling failed', { event: event.id, type: event.type, message: err instanceof Error ? err.message : err })
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
