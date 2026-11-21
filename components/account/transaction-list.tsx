import { ReceiptText } from 'lucide-react'
import { formatMoney, type Transaction } from '@/lib/account'
import { DIVISIONS } from '@/lib/divisions'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<Transaction['status'], string> = {
  success: 'bg-primary/10 text-primary',
  pending: 'bg-secondary/25 text-foreground',
  failed: 'bg-destructive/10 text-destructive',
  refunded: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
}

function divisionName(slug: string) {
  return DIVISIONS.find((d) => d.slug === slug)?.name ?? (slug === 'wallet' ? 'Wallet' : slug)
}

export function TransactionList({ transactions, locale }: { transactions: Transaction[]; locale: string }) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed bg-card px-6 py-12 text-center">
        <ReceiptText className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="mt-3 font-medium">No payments yet</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          When you book a ride, rental, stay or meal, your receipts will appear here.
        </p>
      </div>
    )
  }

  return (
    <ul className="divide-y rounded-xl border bg-card">
      {transactions.map((t) => (
        <li key={t.id} className="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <p className="truncate font-medium">{t.description || divisionName(t.division)}</p>
            <p className="truncate text-sm text-muted-foreground">
              {new Date(t.created_at).toLocaleDateString(locale, { dateStyle: 'medium' })} · {t.reference}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="font-semibold tabular-nums">{formatMoney(Number(t.amount), t.currency, locale)}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', STATUS_STYLES[t.status])}>
              {t.status}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
