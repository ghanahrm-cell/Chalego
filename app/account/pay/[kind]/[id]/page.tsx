import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { StripeCheckout } from '@/components/payments/stripe-checkout'
import { formatMoney } from '@/lib/account'
import { isPayableKind, loadPayableBooking } from '@/lib/payments'
import { requireUser } from '@/lib/session'
import { stripeMode } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = { title: 'Pay by card | CHALEGO', robots: { index: false } }

export default async function PayPage({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params
  if (!isPayableKind(kind)) notFound()
  const { user, country } = await requireUser(`/account/pay/${kind}/${id}`)

  const admin = createAdminClient()
  const booking = await loadPayableBooking(admin, kind, id, user.id)
  if (!booking) notFound()

  const { data: paid } = await admin
    .from('transactions')
    .select('reference, receipt_url')
    .eq('booking_kind', kind)
    .eq('booking_ref', id)
    .eq('provider', 'stripe')
    .in('status', ['success', 'refunded'])
    .maybeSingle<{ reference: string; receipt_url: string | null }>()

  const amountLabel = formatMoney(booking.amount, booking.currency, country?.locale ?? 'en-GH')
  const mode = stripeMode()

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Link href={booking.detailPath} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to booking
      </Link>

      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Pay by card</h1>
        <p className="mt-1 text-muted-foreground">{booking.description}</p>
      </header>

      {mode === 'test' && (
        <p className="rounded-lg border border-secondary/40 bg-secondary/15 p-3 text-sm">
          Stripe is in test mode. No real money is charged.
        </p>
      )}

      <dl className="divide-y rounded-xl border bg-card">
        <div className="flex justify-between gap-4 p-4">
          <dt className="text-muted-foreground">Booking reference</dt>
          <dd className="font-mono text-sm">{booking.reference}</dd>
        </div>
        <div className="flex justify-between gap-4 p-4">
          <dt className="text-muted-foreground">Currency</dt>
          <dd>{booking.currency}</dd>
        </div>
        <div className="flex justify-between gap-4 p-4">
          <dt className="font-medium">Total due (taxes and fees included)</dt>
          <dd className="font-heading text-lg font-semibold">{amountLabel}</dd>
        </div>
      </dl>

      {paid ? (
        <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <CheckCircle2 className="mt-0.5 size-5 text-primary" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-medium">This booking is already paid.</p>
            <p className="text-muted-foreground">Payment reference {paid.reference}.</p>
            {paid.receipt_url && (
              <a href={paid.receipt_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-medium text-primary underline-offset-4 hover:underline">
                View receipt
              </a>
            )}
          </div>
        </div>
      ) : booking.payable ? (
        <StripeCheckout kind={kind} bookingId={id} amountLabel={amountLabel} detailPath={booking.detailPath} />
      ) : (
        <p className="rounded-lg border bg-muted p-4 text-sm text-muted-foreground">This booking can no longer be paid ({booking.status}).</p>
      )}
    </div>
  )
}
