'use server'

import { revalidatePath } from 'next/cache'
import { isAdminRole } from '@/lib/account'
import { getSessionProfile } from '@/lib/session'
import { getStripe, toMinorUnits } from '@/lib/stripe'
import { applyRefund } from '@/lib/stripe-settle'
import { createAdminClient } from '@/lib/supabase/admin'

export type RefundState = { ok?: string; error?: string }

export async function refundStripePayment(_prev: RefundState, form: FormData): Promise<RefundState> {
  const session = await getSessionProfile()
  if (!session || !isAdminRole(session.profile?.role)) return { error: 'Not authorised.' }

  const id = String(form.get('id') ?? '')
  const rawAmount = String(form.get('amount') ?? '').trim()
  const reason = String(form.get('reason') ?? 'requested_by_customer')
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: 'Invalid payment.' }

  const admin = createAdminClient()
  const { data: txn } = await admin
    .from('transactions')
    .select('id, amount, currency, refunded_amount, status, stripe_payment_intent')
    .eq('id', id)
    .eq('provider', 'stripe')
    .maybeSingle<{ id: string; amount: number; currency: string; refunded_amount: number; status: string; stripe_payment_intent: string | null }>()
  if (!txn?.stripe_payment_intent || txn.status !== 'success') return { error: 'Only successful card payments can be refunded.' }

  const remaining = Number(txn.amount) - Number(txn.refunded_amount)
  const amount = rawAmount ? Number(rawAmount) : remaining
  if (!Number.isFinite(amount) || amount <= 0 || amount > remaining + 1e-9) {
    return { error: `Refund must be between 0 and ${remaining.toFixed(2)} ${txn.currency.trim()}.` }
  }

  const stripe = getStripe()
  try {
    const refund = await stripe.refunds.create(
      {
        payment_intent: txn.stripe_payment_intent,
        amount: toMinorUnits(amount, txn.currency.trim()),
        reason: reason === 'duplicate' || reason === 'fraudulent' ? reason : 'requested_by_customer',
        metadata: { transaction_id: txn.id, admin_id: session.user.id },
      },
      { idempotencyKey: `refund-${txn.id}-${Math.round(Number(txn.refunded_amount) * 100)}-${Math.round(amount * 100)}` },
    )
    const chargeId = typeof refund.charge === 'string' ? refund.charge : refund.charge?.id
    if (chargeId) await applyRefund(admin, await stripe.charges.retrieve(chargeId))
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Refund failed.' }
  }

  revalidatePath('/admin/stripe')
  return { ok: `Refunded ${amount.toFixed(2)} ${txn.currency.trim()}.` }
}
