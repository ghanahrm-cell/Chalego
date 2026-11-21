import 'server-only'
import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fromMinorUnits, getStripe, toMinorUnits } from '@/lib/stripe'

type TxnRow = {
  id: string
  user_id: string
  amount: number
  currency: string
  status: string
  booking_kind: string | null
  booking_ref: string | null
  reference: string
  description: string | null
}

const TXN_COLUMNS = 'id, user_id, amount, currency, status, booking_kind, booking_ref, reference, description'

const DETAIL_PATHS: Record<string, string> = {
  stay: '/account/stays',
  rental: '/account/rentals',
  food: '/account/food',
  shipment: '/account/deliveries',
  ride: '/account/trips',
}

function idOf(value: string | { id: string } | null | undefined) {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}

async function notify(admin: SupabaseClient, txn: TxnRow, status: 'success' | 'failed' | 'refunded', detail?: string) {
  const amount = new Intl.NumberFormat('en', { style: 'currency', currency: txn.currency.trim() }).format(Number(txn.amount))
  const copy = {
    success: { title: 'Payment received', body: `${amount} paid for ${txn.description ?? txn.reference}. Ref ${txn.reference}.` },
    failed: { title: 'Payment failed', body: `Your payment of ${amount} for ${txn.description ?? txn.reference} did not go through${detail ? `: ${detail}` : ''}.` },
    refunded: { title: 'Refund issued', body: `${detail ?? amount} has been refunded for ${txn.description ?? txn.reference}.` },
  }[status]
  const base = txn.booking_kind ? DETAIL_PATHS[txn.booking_kind] : null
  await admin.from('notifications').insert({
    user_id: txn.user_id,
    kind: `payment_${status}`,
    title: copy.title,
    body: copy.body,
    link: base && txn.booking_ref ? `${base}/${txn.booking_ref}` : '/account/payments',
  })
}

async function audit(admin: SupabaseClient, txnId: string, action: string, details: Record<string, unknown>) {
  await admin.from('audit_logs').insert({ action, entity: 'transactions', entity_id: txnId, details: { provider: 'stripe', ...details } })
}

export type SettleResult = 'success' | 'failed' | 'pending' | 'cancelled' | 'refunded' | 'unknown'

// Shared by the webhook and the return page. Every transition is conditional on the row
// still being pending, so concurrent deliveries can only apply it once.
export async function settleCheckoutSession(admin: SupabaseClient, session: Stripe.Checkout.Session): Promise<SettleResult> {
  const { data: txn } = await admin.from('transactions').select(TXN_COLUMNS).eq('stripe_session_id', session.id).maybeSingle<TxnRow>()
  if (!txn) return 'unknown'
  if (txn.status !== 'pending') return txn.status as SettleResult

  if (session.status === 'expired') {
    await admin.from('transactions').update({ status: 'cancelled', failure_reason: 'Checkout session expired' }).eq('id', txn.id).eq('status', 'pending')
    return 'cancelled'
  }
  if (session.payment_status !== 'paid') return 'pending'

  const currency = txn.currency.trim().toUpperCase()
  const amountMatches = session.amount_total === toMinorUnits(Number(txn.amount), currency) && session.currency?.toUpperCase() === currency
  const paymentIntentId = idOf(session.payment_intent)

  let chargeId: string | null = null
  let receiptUrl: string | null = null
  if (paymentIntentId) {
    const pi = await getStripe().paymentIntents.retrieve(paymentIntentId, { expand: ['latest_charge'] })
    const charge = pi.latest_charge && typeof pi.latest_charge !== 'string' ? pi.latest_charge : null
    chargeId = charge?.id ?? null
    receiptUrl = charge?.receipt_url ?? null
  }

  const status = amountMatches ? 'success' : 'failed'
  const { data: updated } = await admin
    .from('transactions')
    .update({
      status,
      stripe_payment_intent: paymentIntentId,
      stripe_charge_id: chargeId,
      provider_reference: paymentIntentId,
      receipt_url: receiptUrl,
      customer_email: session.customer_details?.email ?? null,
      paid_at: amountMatches ? new Date().toISOString() : null,
      failure_reason: amountMatches ? null : 'Paid amount did not match the booking total',
    })
    .eq('id', txn.id)
    .eq('status', 'pending')
    .select('id')

  if (!updated?.length) return 'pending'

  if (amountMatches && txn.booking_ref) {
    // The booking flow records its own pending card row on confirmation; the Stripe row replaces it.
    await admin
      .from('transactions')
      .update({ status: 'cancelled', failure_reason: 'Settled by Stripe checkout' })
      .eq('booking_ref', txn.booking_ref)
      .eq('provider', 'stripe')
      .eq('payment_type', 'full')
      .eq('status', 'pending')
      .is('booking_kind', null)
  }

  await audit(admin, txn.id, `payment_${status}`, { session: session.id, amount_matches: amountMatches })
  await notify(admin, txn, status)
  return status
}

export async function failPayment(admin: SupabaseClient, match: { sessionId?: string; paymentIntentId?: string }, reason: string) {
  let query = admin.from('transactions').select(TXN_COLUMNS).eq('provider', 'stripe').eq('status', 'pending')
  query = match.sessionId ? query.eq('stripe_session_id', match.sessionId) : query.eq('stripe_payment_intent', match.paymentIntentId ?? '')
  const { data: txn } = await query.maybeSingle<TxnRow>()
  if (!txn) return

  const { data: updated } = await admin
    .from('transactions')
    .update({ status: 'failed', failure_reason: reason.slice(0, 300) })
    .eq('id', txn.id)
    .eq('status', 'pending')
    .select('id')
  if (!updated?.length) return
  await audit(admin, txn.id, 'payment_failed', { reason })
  await notify(admin, txn, 'failed', reason)
}

// A card decline on embedded checkout leaves the session open for another attempt,
// so it is recorded on the row without closing the payment.
export async function recordAttemptFailure(admin: SupabaseClient, paymentIntentId: string, sessionId: string | null, reason: string) {
  const update = { failure_reason: reason.slice(0, 300), stripe_payment_intent: paymentIntentId }
  if (sessionId) {
    await admin.from('transactions').update(update).eq('stripe_session_id', sessionId).eq('status', 'pending')
  } else {
    await admin.from('transactions').update({ failure_reason: update.failure_reason }).eq('stripe_payment_intent', paymentIntentId).eq('status', 'pending')
  }
}

export async function applyRefund(admin: SupabaseClient, charge: Stripe.Charge) {
  const paymentIntentId = idOf(charge.payment_intent)
  if (!paymentIntentId) return
  const { data: txn } = await admin
    .from('transactions')
    .select(`${TXN_COLUMNS}, refunded_amount`)
    .eq('stripe_payment_intent', paymentIntentId)
    .in('status', ['success', 'refunded'])
    .maybeSingle<TxnRow & { refunded_amount: number }>()
  if (!txn) return

  const refunded = fromMinorUnits(charge.amount_refunded, txn.currency.trim())
  if (refunded <= Number(txn.refunded_amount)) return

  const full = charge.refunded || refunded >= Number(txn.amount)
  await admin
    .from('transactions')
    .update({ refunded_amount: refunded, status: full ? 'refunded' : 'success' })
    .eq('id', txn.id)

  const formatted = new Intl.NumberFormat('en', { style: 'currency', currency: txn.currency.trim() }).format(refunded - Number(txn.refunded_amount))
  await audit(admin, txn.id, full ? 'payment_refunded' : 'payment_partially_refunded', { charge: charge.id, refunded_total: refunded })
  await notify(admin, txn, 'refunded', formatted)
}
