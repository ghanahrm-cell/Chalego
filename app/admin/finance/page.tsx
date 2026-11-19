import type { Metadata } from 'next'
import Link from 'next/link'
import { Download } from 'lucide-react'
import { requireAdmin } from '@/lib/session'
import { formatMoney } from '@/lib/account'
import { DIVISION_LABELS, RANGES, loadFinance, resolveRange, totalsByCurrency } from '@/lib/admin-reports'
import { CommissionChart } from '@/components/admin/commission-chart'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Finance · Admin' }

export default async function AdminFinancePage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { supabase } = await requireAdmin()
  const { range } = await searchParams
  const { value, from, to } = resolveRange(range)
  const { rows, days, error } = await loadFinance(supabase, from, to)
  const totals = totalsByCurrency(rows)
  const currencies = [...new Set(days.map((d) => d.currency))]

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Finance</h1>
          <p className="mt-1 text-muted-foreground">Revenue, commission and partner earnings across every division.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav aria-label="Date range" className="flex rounded-lg border bg-card p-1">
            {RANGES.map((r) => (
              <Link
                key={r.value}
                href={`/admin/finance?range=${r.value}`}
                aria-current={r.value === value ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium',
                  r.value === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {r.label}
              </Link>
            ))}
          </nav>
          <a
            href={`/admin/finance/export?range=${value}`}
            className="inline-flex h-10 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium hover:bg-muted"
          >
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </a>
        </div>
      </header>

      {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <section aria-labelledby="totals" className="flex flex-col gap-3">
        <h2 id="totals" className="font-heading text-lg font-semibold">Totals by currency</h2>
        {totals.length === 0 ? (
          <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">No completed activity in this period yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {totals.map((t) => (
              <div key={t.currency} className="flex flex-col gap-3 rounded-xl border bg-card p-5">
                <p className="text-sm font-medium text-muted-foreground">{t.currency} · {t.completed.toLocaleString()} completed</p>
                <div>
                  <p className="text-xs text-muted-foreground">Platform commission</p>
                  <p className="font-heading text-3xl font-bold tabular-nums text-primary">{formatMoney(t.commission, t.currency)}</p>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Gross volume</dt>
                    <dd className="font-medium tabular-nums">{formatMoney(t.gross, t.currency)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Partner earnings</dt>
                    <dd className="font-medium tabular-nums">{formatMoney(t.partner, t.currency)}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        )}
      </section>

      {currencies.map((c) => (
        <CommissionChart key={c} currency={c} days={days.filter((d) => d.currency === c)} from={from} to={to} />
      ))}

      <section aria-labelledby="divisions" className="flex flex-col gap-3">
        <h2 id="divisions" className="font-heading text-lg font-semibold">By division</h2>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Division</th>
                <th scope="col" className="px-4 py-3 font-medium">Currency</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Completed</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Open</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Cancelled</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Gross</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Commission</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Partner earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">No bookings or orders in this period.</td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={`${r.division}-${r.currency}`}>
                  <th scope="row" className="px-4 py-3 text-left font-medium">{DIVISION_LABELS[r.division] ?? r.division}</th>
                  <td className="px-4 py-3">{r.currency}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.completed_count.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.open_count.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.cancelled_count.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatMoney(r.gross, r.currency)}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-primary">{formatMoney(r.commission, r.currency)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatMoney(r.partner_earnings, r.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Counts include everything created in the period. Money totals include completed or delivered items only. Food partner earnings include courier pay.
        </p>
      </section>
    </div>
  )
}
