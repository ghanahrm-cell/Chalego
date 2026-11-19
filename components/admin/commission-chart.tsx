import { formatMoney } from '@/lib/account'
import type { DailyRow } from '@/lib/admin-reports'

const MAX_BARS = 60

export function CommissionChart({ currency, days, from, to }: { currency: string; days: DailyRow[]; from: Date; to: Date }) {
  const byDay = new Map(days.map((d) => [d.day, d.commission]))
  const span = Math.ceil((to.getTime() - from.getTime()) / 86_400_000)
  const bucketDays = Math.max(1, Math.ceil(span / MAX_BARS))

  const buckets: { label: string; value: number }[] = []
  for (let start = 0; start < span; start += bucketDays) {
    let value = 0
    for (let i = start; i < Math.min(start + bucketDays, span); i++) {
      const key = new Date(from.getTime() + (i + 1) * 86_400_000).toISOString().slice(0, 10)
      value += byDay.get(key) ?? 0
    }
    const labelDate = new Date(from.getTime() + (start + 1) * 86_400_000)
    buckets.push({ label: labelDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), value })
  }

  const max = Math.max(...buckets.map((b) => b.value), 1)
  const total = buckets.reduce((s, b) => s + b.value, 0)

  return (
    <section aria-label={`Commission over time in ${currency}`} className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-heading text-lg font-semibold">Commission trend · {currency}</h2>
        <p className="text-sm text-muted-foreground">
          {bucketDays > 1 ? `${bucketDays}-day buckets` : 'Daily'} · {formatMoney(total, currency)}
        </p>
      </div>
      <ol className="flex h-40 items-end gap-0.5" role="list">
        {buckets.map((b, i) => (
          <li key={i} className="group relative flex h-full flex-1 items-end">
            <span
              className="w-full rounded-t-sm bg-primary/80 transition-colors group-hover:bg-primary"
              style={{ height: `${Math.max((b.value / max) * 100, b.value > 0 ? 2 : 0.5)}%` }}
            />
            <span className="sr-only">
              {b.label}: {formatMoney(b.value, currency)}
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background group-hover:block"
            >
              {b.label}: {formatMoney(b.value, currency)}
            </span>
          </li>
        ))}
      </ol>
      <div className="flex justify-between text-xs text-muted-foreground" aria-hidden="true">
        <span>{buckets[0]?.label}</span>
        <span>{buckets.at(-1)?.label}</span>
      </div>
    </section>
  )
}
