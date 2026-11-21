import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { formatMoney } from '@/lib/account'
import { requireUser } from '@/lib/session'
import { getStripe } from '@/lib/stripe'
import { settleCheckoutSession, type SettleResult } from '@/lib/stripe-settle'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = { title: 'Payment status | CHALEGO', robots: { index: false } }

const DETAIL_PATHS: Record<string, string> = {
  stay: '/account/stays',
  rental: '/account/rentals',
  food: '/account/food',
  shipment: '/account/deliveries',
  ride: '/account/trips',
}

type Txn = {
  id: string
  user_id: string
  amount: number
  currency: string
  reference: string
  description: string | null
  receipt_url: string | null
  failure_reason: string | null
  booking_kind: string | null
  booking_ref: string | null
}

export default async function PaymentReturnPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams
  if (!sessionId || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) notFound()
  const { user, country } = await requireUser('/account/payments')

  const admin = createAdminClient()
  const { data: txn } = await admin
    .from('transactions')
    .select('id, user_id, amount, currency, reference, description, receipt_url, failure_reason, booking_kind, booking_ref')
    .eq('stripe_session_id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle<Txn>()
  if (!txn) notFound()

  // Settles immediately when the redirect beats the webhook; both paths are idempotent.
  let result: SettleResult = 'pending'
  try {
    result = await settleCheckoutSession(admin, await getStripe().checkout.sessions.retrieve(sessionId))
  } catch (err) {
    console.error('Stripe return settle failed', { session: sessionId, message: err instanceof Error ? err.message : err })
  }

  const { data: fresh } = await admin.from('transactions').select('receipt_url, failure_reason').eq('id', txn.id).single<Pick<Txn, 'receipt_url' | 'failure_reason'>>()
  const amount = formatMoney(Number(txn.amount), txn.currency.trim(), country?.locale ?? 'en-GH')
  const detail = txn.booking_kind && txn.booking_ref ? `${DETAIL_PATHS[txn.booking_kind]}/${txn.booking_ref}` : '/account/payments'
  const retry = txn.booking_kind && txn.booking_ref ? `/account/pay/${txn.booking_kind}/${txn.booking_ref}` : null

  const view =
    result === 'success' || result === 'refunded'
      ? { icon: CheckCircle2, tone: 'text-primary', title: 'Payment successful', body: `${amount} paid for ${txn.description ?? 'your booking'}. A receipt has been emailed to you.` }
      : result === 'pending'
        ? { icon: Clock, tone: 'text-foreground', title: 'Payment processing', body: 'Your bank is still confirming this payment. We will notify you as soon as it completes.' }
        : { icon: XCircle, tone: 'text-destructive', title: 'Payment not completed', body: fresh?.failure_reason ?? 'The payment did not go through. You have not been charged.' }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-8 text-center" role="status" aria-live="polite">
      <view.icon className={`size-12 ${view.tone}`} aria-hidden="true" />
      <h1 className="font-heading text-3xl font-bold tracking-tight">{view.title}</h1>
      <p className="text-muted-foreground">{view.body}</p>
      <p className="font-mono text-sm text-muted-foreground">Ref {txn.reference}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link href={detail} className={buttonVariants()}>View booking</Link>
        {fresh?.receipt_url && (
          <a href={fresh.receipt_url} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline' })}>View receipt</a>
        )}
        {(result === 'failed' || result === 'cancelled') && retry && (
          <Link href={retry} className={buttonVariants({ variant: 'outline' })}>Try again</Link>
        )}
        <Link href="/account/payments" className={buttonVariants({ variant: 'ghost' })}>Payment history</Link>
      </div>
    </div>
  )
}
