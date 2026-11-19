import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { requireUser } from '@/lib/session'
import { formatMoney } from '@/lib/account'
import { formatRange, RENTAL_STATUS_STYLES, type RentalStatus } from '@/lib/rentals'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'My rentals', robots: { index: false } }

type Row = {
  id: string
  reference: string
  vehicle_id: string
  kind: string
  status: RentalStatus
  start_at: string
  end_at: string
  total_amount: number
  currency: string
}

export default async function MyRentalsPage() {
  const { supabase, user, country } = await requireUser('/account/rentals')
  const locale = country?.locale ?? 'en-GH'
  const { data: rows } = await supabase
    .from('rental_bookings')
    .select('id, reference, vehicle_id, kind, status, start_at, end_at, total_amount, currency')
    .eq('renter_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
    .returns<Row[]>()
  const ids = [...new Set((rows ?? []).map((r) => r.vehicle_id))]
  const { data: vehicles } = ids.length
    ? await supabase.from('rental_vehicles').select('id, title').in('id', ids).returns<{ id: string; title: string }[]>()
    : { data: [] }
  const titles = new Map((vehicles ?? []).map((v) => [v.id, v.title]))

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">My rentals</h1>
          <p className="text-sm text-muted-foreground">Cars and trucks you have booked.</p>
        </div>
        <Link href="/rentals" className="text-sm font-medium text-primary hover:underline">Find a rental</Link>
      </header>
      {(rows ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No rentals yet. <Link href="/rentals" className="font-medium text-primary hover:underline">Browse vehicles</Link>
        </p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {rows!.map((r) => (
            <li key={r.id}>
              <Link href={`/account/rentals/${r.id}`} className="flex items-center gap-4 px-4 py-4 hover:bg-muted/50">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{titles.get(r.vehicle_id) ?? (r.kind === 'truck' ? 'Truck rental' : 'Vehicle rental')}</p>
                  <p className="text-sm text-muted-foreground">{r.reference} · {formatRange(r.start_at, r.end_at, locale)}</p>
                </div>
                <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold capitalize', RENTAL_STATUS_STYLES[r.status])}>{r.status}</span>
                <span className="hidden font-medium sm:block">{formatMoney(Number(r.total_amount), r.currency, locale)}</span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
