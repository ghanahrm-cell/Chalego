import Link from 'next/link'
import { CheckCircle2, CreditCard } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { formatMoney } from '@/lib/account'
import { loadPayableBooking, type PayableKind } from '@/lib/payments'
import { isStripeConfigured } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PayByCardPanel({ kind, id, userId, locale }: { kind: PayableKind; id: string; userId: string; locale: string }) {
  if (!isStripeConfigured()) return null
  const admin = createAdminClient()
  const booking = await loadPayableBooking(admin, kind, id, userId)
  if (!booking) return null

  const { data: paid } = await admin
    .from('transactions')
    .select('reference, receipt_url, status, refunded_amount')
    .eq('booking_kind', kind)
    .eq('booking_ref', id)
    .eq('provider', 'stripe')
    .in('status', ['success', 'refunded'])
    .maybeSingle<{ reference: string; receipt_url: string | null; status: string; refunded_amount: number }>()

  const amount = formatMoney(booking.amount, booking.currency, locale)

  if (paid) {
    return (
      <section className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="text-sm">
          <h2 className="font-heading text-base font-semibold">{paid.status === 'refunded' ? 'Refunded' : 'Paid by card'}</h2>
          <p className="text-muted-foreground">
            {Number(paid.refunded_amount) > 0 ? `${formatMoney(Number(paid.refunded_amount), booking.currency, locale)} refunded · ` : ''}Ref {paid.reference}
          </p>
          {paid.receipt_url && (
            <a href={paid.receipt_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-medium text-primary underline-offset-4 hover:underline">
              View receipt
            </a>
          )}
        </div>
      </section>
    )
  }

  if (!booking.payable) return null

  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
      <div>
        <h2 className="font-heading text-base font-semibold">Pay online</h2>
        <p className="text-sm text-muted-foreground">Settle {amount} securely by card with Stripe.</p>
      </div>
      <Link href={`/account/pay/${kind}/${id}`} className={buttonVariants()}>
        <CreditCard aria-hidden="true" /> Pay {amount} by card
      </Link>
    </section>
  )
}
