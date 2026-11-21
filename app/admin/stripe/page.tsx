import type { Metadata } from 'next'
import Link from 'next/link'
import { Download } from 'lucide-react'
import { StripeRefundForm } from '@/components/admin/stripe-refund-form'
import { buttonVariants } from '@/components/ui/button'
import { formatMoney } from '@/lib/account'
import { requireAdmin } from '@/lib/session'
import { isStripeConfigured, stripeMode } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Card payments | CHALEGO Admin', robots: { index: false } }

const STATUSES = ['all', 'success', 'pending', 'failed', 'refunded', 'cancelled'] as const

const STATUS_STYLES: Record<string, string> = {
  success: 'bg-primary/10 text-primary',
  pending: 'bg-secondary/25 text-foreground',
  failed: 'bg-destructive/10 text-destructive',
  refunded: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
}

type Row = {
  id: string
  created_at: string
  reference: string
  status: string
  currency: string
  amount: number
  refunded_amount: number
  description: string | null
  customer_email: string | null
  failure_reason: string | null
  receipt_url: string | null
  stripe_payment_intent: string | null
}

export default async function AdminStripePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin()
  const { status: rawStatus } = await searchParams
  const status = STATUSES.includes(rawStatus as (typeof STATUSES)[number]) ? rawStatus! : 'all'

  const admin = createAdminClient()
  let query = admin
    .from('transactions')
    .select('id, created_at, reference, status, currency, amount, refunded_amount, description, customer_email, failure_reason, receipt_url, stripe_payment_intent')
    .eq('provider', 'stripe')
    .order('created_at', { ascending: false })
    .limit(200)
  if (status !== 'all') query = query.eq('status', status)

  const [{ data: rows }, { data: totals }] = await Promise.all([
    query.returns<Row[]>(),
    admin.from('transactions').select('status, currency, amount, refunded_amount').eq('provider', 'stripe').in('status', ['success', 'refunded', 'failed']).returns<Pick<Row, 'status' | 'currency' | 'amount' | 'refunded_amount'>[]>(),
  ])

  const summary = new Map<string, { gross: number; refunded: number; count: number; failed: number }>()
  for (const t of totals ?? []) {
    const cur = t.currency.trim()
    const s = summary.get(cur) ?? { gross: 0, refunded: 0, count: 0, failed: 0 }
    if (t.status === 'failed') s.failed += 1
    else {
      s.gross += Number(t.amount)
      s.refunded += Number(t.refunded_amount)
      s.count += 1
    }
    summary.set(cur, s)
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Card payments</h1>
          <p className="mt-1 text-muted-foreground">
            Stripe {isStripeConfigured() ? `${stripeMode()} mode` : 'not configured'} · success, failures and refunds
          </p>
        </div>
        <a href={`/admin/stripe/export${status !== 'all' ? `?status=${status}` : ''}`} className={buttonVariants({ variant: 'outline' })}>
          <Download aria-hidden="true" /> Export CSV
        </a>
      </header>

      {summary.size > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...summary.entries()].map(([cur, s]) => (
            <li key={cur} className="rounded-xl border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{cur}</p>
              <p className="mt-1 font-heading text-2xl font-semibold">{formatMoney(s.gross - s.refunded, cur)}</p>
              <p className="text-sm text-muted-foreground">
                {s.count} paid · {formatMoney(s.refunded, cur)} refunded · {s.failed} failed
              </p>
            </li>
          ))}
        </ul>
      )}

      <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={s === 'all' ? '/admin/stripe' : `/admin/stripe?status=${s}`}
            aria-current={status === s ? 'page' : undefined}
            className={cn('rounded-full border px-3 py-1 text-sm capitalize', status === s ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted')}
          >
            {s}
          </Link>
        ))}
      </nav>

      {!rows?.length ? (
        <p className="rounded-xl border border-dashed bg-card p-8 text-center text-muted-foreground">No card payments yet.</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {rows.map((r) => {
            const cur = r.currency.trim()
            const remaining = Number(r.amount) - Number(r.refunded_amount)
            return (
              <li key={r.id} className="flex flex-col gap-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.description ?? r.reference}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {new Date(r.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })} · {r.reference}
                      {r.customer_email ? ` · ${r.customer_email}` : ''}
                    </p>
                    {r.failure_reason && <p className="text-sm text-destructive">{r.failure_reason}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', STATUS_STYLES[r.status])}>{r.status}</span>
                    <span className="font-heading font-semibold">{formatMoney(Number(r.amount), cur)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {Number(r.refunded_amount) > 0 && <span className="text-muted-foreground">Refunded {formatMoney(Number(r.refunded_amount), cur)}</span>}
                  {r.receipt_url && (
                    <a href={r.receipt_url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">Receipt</a>
                  )}
                  {r.stripe_payment_intent && (
                    <a
                      href={`https://dashboard.stripe.com/${stripeMode() === 'test' ? 'test/' : ''}payments/${r.stripe_payment_intent}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      Open in Stripe
                    </a>
                  )}
                </div>
                {r.status === 'success' && remaining > 0 && <StripeRefundForm id={r.id} remaining={remaining} currency={cur} />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
