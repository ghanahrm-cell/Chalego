'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionProfile } from '@/lib/session'
import { isPayableKind, loadPayableBooking, newPaymentReference } from '@/lib/payments'
import { getStripe, isStripeConfigured, toMinorUnits } from '@/lib/stripe'
import { settleCheckoutSession } from '@/lib/stripe-settle'

export type CheckoutStart = { clientSecret: string } | { paid: true } | { error: string }

async function originFromRequest() {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

export async function startStripeCheckout(kind: string, bookingId: string): Promise<CheckoutStart> {
  if (!isStripeConfigured()) return { error: 'Card payments are not available right now.' }
  if (!isPayableKind(kind)) return { error: 'Unknown booking type.' }

  const session = await getSessionProfile()
  if (!session) return { error: 'Please sign in to pay.' }

  const admin = createAdminClient()
  const booking = await loadPayableBooking(admin, kind, bookingId, session.user.id)
  if (!booking) return { error: 'Booking not found.' }
  if (!booking.payable) return { error: 'This booking can no longer be paid.' }

  const stripe = getStripe()
  const unitAmount = toMinorUnits(booking.amount, booking.currency)

  const { data: existing } = await admin
    .from('transactions')
    .select('id, status, stripe_session_id')
    .eq('booking_kind', kind)
    .eq('booking_ref', booking.id)
    .eq('provider', 'stripe')
    .eq('payment_type', 'full')
    .in('status', ['pending', 'success', 'refunded'])
    .maybeSingle<{ id: string; status: string; stripe_session_id: string | null }>()

  if (existing && existing.status !== 'pending') return { paid: true }

  if (existing?.stripe_session_id) {
    const prior = await stripe.checkout.sessions.retrieve(existing.stripe_session_id)
    if (prior.status === 'complete') {
      const result = await settleCheckoutSession(admin, prior)
      if (result === 'success') return { paid: true }
    }
    if (prior.status === 'open' && prior.amount_total === unitAmount && prior.client_secret) {
      return { clientSecret: prior.client_secret }
    }
    if (prior.status === 'open') await stripe.checkout.sessions.expire(prior.id).catch(() => null)
  }
  if (existing) {
    await admin
      .from('transactions')
      .update({ status: 'cancelled', failure_reason: 'Replaced by a new checkout session' })
      .eq('id', existing.id)
      .eq('status', 'pending')
  }

  const reference = newPaymentReference()
  const { data: txn, error: insertError } = await admin
    .from('transactions')
    .insert({
      user_id: session.user.id,
      country_code: booking.countryCode,
      currency: booking.currency,
      amount: booking.amount,
      division: booking.division,
      payment_type: 'full',
      provider: 'stripe',
      reference,
      status: 'pending',
      booking_kind: kind,
      booking_ref: booking.id,
      description: booking.description,
      customer_email: session.user.email ?? null,
    })
    .select('id')
    .single<{ id: string }>()

  if (insertError || !txn) {
    return { error: insertError?.code === '23505' ? 'A payment for this booking is already in progress.' : 'Could not start the payment.' }
  }

  const metadata = { transaction_id: txn.id, booking_kind: kind, booking_id: booking.id, reference }
  try {
    const checkout = await stripe.checkout.sessions.create(
      {
        ui_mode: 'embedded_page',
        mode: 'payment',
        client_reference_id: txn.id,
        customer_email: session.user.email ?? undefined,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: booking.currency.toLowerCase(),
              unit_amount: unitAmount,
              product_data: { name: booking.description, description: `CHALEGO reference ${booking.reference}` },
            },
          },
        ],
        payment_intent_data: {
          description: `${booking.description} (${reference})`,
          receipt_email: session.user.email ?? undefined,
          metadata,
        },
        metadata,
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
        return_url: `${await originFromRequest()}/account/pay/return?session_id={CHECKOUT_SESSION_ID}`,
      },
      { idempotencyKey: `checkout-${txn.id}` },
    )

    await admin.from('transactions').update({ stripe_session_id: checkout.id }).eq('id', txn.id)
    if (!checkout.client_secret) throw new Error('Missing client secret')
    return { clientSecret: checkout.client_secret }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe error'
    console.error('Stripe checkout session failed', { transaction: txn.id, message })
    await admin.from('transactions').update({ status: 'cancelled', failure_reason: message.slice(0, 300) }).eq('id', txn.id)
    return { error: 'Card payment could not be started for this currency or amount. Please choose another payment method.' }
  }
}
