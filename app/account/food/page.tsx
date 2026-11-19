import type { Metadata } from 'next'
import Link from 'next/link'
import { requireUser } from '@/lib/session'
import { formatMoney } from '@/lib/account'
import { FOOD_STATUS_LABELS, FOOD_STATUS_STYLES, type FoodStatus } from '@/lib/food'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'My food orders', robots: { index: false } }

type Row = { id: string; reference: string; restaurant_id: string; status: FoodStatus; fulfilment: string; total_amount: number; currency: string; created_at: string }

export default async function MyFoodOrdersPage() {
  const { supabase, user, country } = await requireUser('/account/food')
  const locale = country?.locale ?? 'en-GH'
  const { data: rows } = await supabase
    .from('food_orders')
    .select('id, reference, restaurant_id, status, fulfilment, total_amount, currency, created_at')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
    .returns<Row[]>()
  const ids = [...new Set((rows ?? []).map((r) => r.restaurant_id))]
  const { data: rests } = ids.length
    ? await supabase.from('restaurants').select('id, name').in('id', ids).returns<{ id: string; name: string }[]>()
    : { data: [] }
  const names = new Map((rests ?? []).map((r) => [r.id, r.name]))
  const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">My food orders</h1>
          <p className="text-sm text-muted-foreground">Delivery and pickup orders from restaurants.</p>
        </div>
        <Link href="/food" className="text-sm font-medium text-primary hover:underline">Order food</Link>
      </header>
      {(rows ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No orders yet. <Link href="/food" className="font-medium text-primary hover:underline">Browse restaurants</Link>
        </p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {rows!.map((r) => (
            <li key={r.id}>
              <Link href={`/account/food/${r.id}`} className="flex items-center gap-4 px-4 py-4 hover:bg-muted/50">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{names.get(r.restaurant_id) ?? 'Restaurant'}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.reference} · {date.format(new Date(r.created_at))} · <span className="capitalize">{r.fulfilment}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', FOOD_STATUS_STYLES[r.status])}>{FOOD_STATUS_LABELS[r.status]}</span>
                  <span className="text-sm">{formatMoney(Number(r.total_amount), r.currency, locale)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
