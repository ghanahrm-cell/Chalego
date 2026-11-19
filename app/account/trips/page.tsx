import Link from 'next/link'
import { Car, ChevronRight, Plane, Route } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { formatMoney } from '@/lib/account'
import { requireUser } from '@/lib/session'
import { STATUS_LABEL, STATUS_STYLE, type RideSummary } from '@/lib/rides'
import { cn } from '@/lib/utils'

export default async function TripsPage() {
  const { supabase, user, country } = await requireUser('/account/trips')
  const locale = country?.locale ?? 'en-GH'

  const { data: rides } = await supabase
    .from('rides')
    .select('id, ride_type, category_code, pickup_address, dropoff_address, fare_estimate, final_fare, currency, status, scheduled_for, created_at')
    .eq('rider_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
    .returns<RideSummary[]>()

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">My trips</h1>
          <p className="mt-1 text-muted-foreground">Rides and airport transfers, upcoming and past.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/ride" className={cn(buttonVariants(), 'h-10')}>
            <Car data-icon="inline-start" aria-hidden="true" /> Book a ride
          </Link>
          <Link href="/airport" className={cn(buttonVariants({ variant: 'outline' }), 'h-10')}>
            <Plane data-icon="inline-start" aria-hidden="true" /> Airport
          </Link>
        </div>
      </header>

      {(rides ?? []).length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed bg-card px-6 py-12 text-center">
          <Route className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 font-medium">No trips yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">Book your first ride and it will show up here with a live tracker and receipt.</p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {rides!.map((r) => (
            <li key={r.id}>
              <Link href={`/account/trips/${r.id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  {r.ride_type === 'airport' ? <Plane className="size-5" aria-hidden="true" /> : <Car className="size-5" aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{r.dropoff_address}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {new Date(r.scheduled_for ?? r.created_at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })} · from{' '}
                    {r.pickup_address}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-semibold tabular-nums">{formatMoney(Number(r.final_fare ?? r.fare_estimate), r.currency, locale)}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLE[r.status])}>{STATUS_LABEL[r.status]}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
