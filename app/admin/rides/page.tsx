import Link from 'next/link'
import { Plane } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/account'
import { requireAdmin } from '@/lib/session'
import { STATUS_LABEL, STATUS_STYLE, type RideStatus } from '@/lib/rides'
import { cn } from '@/lib/utils'
import { adminCancelRide } from '../ride-actions'

const FILTERS = ['active', 'scheduled', 'completed', 'cancelled'] as const
type Filter = (typeof FILTERS)[number]

export default async function AdminRidesPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { supabase } = await requireAdmin()
  const sp = await searchParams
  const view: Filter = FILTERS.includes(sp.view as Filter) ? (sp.view as Filter) : 'active'

  let query = supabase
    .from('rides')
    .select('id, ride_type, category_code, pickup_address, dropoff_address, fare_estimate, final_fare, commission_amount, currency, status, scheduled_for, flight_number, country_code, created_at')
    .limit(100)
  if (view === 'active') query = query.in('status', ['requested', 'accepted', 'arriving', 'in_progress']).is('scheduled_for', null).order('created_at', { ascending: false })
  else if (view === 'scheduled') query = query.in('status', ['requested', 'accepted']).not('scheduled_for', 'is', null).order('scheduled_for')
  else query = query.eq('status', view).order('created_at', { ascending: false })

  const [{ data: rides }, { data: stats }] = await Promise.all([
    query,
    supabase.from('rides').select('status, final_fare, commission_amount, currency').eq('status', 'completed').gte('completed_at', new Date(Date.now() - 30 * 86400_000).toISOString()),
  ])

  const byCurrency = new Map<string, { gmv: number; commission: number; trips: number }>()
  for (const r of stats ?? []) {
    const s = byCurrency.get(r.currency) ?? { gmv: 0, commission: 0, trips: 0 }
    s.gmv += Number(r.final_fare ?? 0)
    s.commission += Number(r.commission_amount ?? 0)
    s.trips += 1
    byCurrency.set(r.currency, s)
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Rides &amp; transfers</h1>
        <p className="mt-1 text-muted-foreground">Live operations and the last 30 days of completed trips.</p>
      </header>

      {byCurrency.size > 0 && (
        <section aria-label="Last 30 days" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...byCurrency].map(([cur, s]) => (
            <div key={cur} className="rounded-xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">{cur} · {s.trips} trips</p>
              <p className="font-heading text-2xl font-bold tabular-nums">{formatMoney(s.gmv, cur)}</p>
              <p className="text-sm text-muted-foreground tabular-nums">{formatMoney(s.commission, cur)} commission</p>
            </div>
          ))}
        </section>
      )}

      <nav aria-label="Ride filter" className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/admin/rides?view=${f}`}
            aria-current={f === view ? 'page' : undefined}
            className={cn('shrink-0 rounded-lg px-4 py-2 text-sm font-medium capitalize', f === view ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground')}
          >
            {f}
          </Link>
        ))}
      </nav>

      {(rides ?? []).length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card p-10 text-center text-muted-foreground">No {view} trips.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[48rem] text-sm">
            <thead className="border-b text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Trip</th>
                <th scope="col" className="px-4 py-3 font-medium">Route</th>
                <th scope="col" className="px-4 py-3 font-medium">When</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Fare</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rides!.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <Link href={`/account/trips/${r.id}`} className="font-mono text-xs font-medium text-primary hover:underline">
                      {r.id.slice(0, 8).toUpperCase()}
                    </Link>
                    <p className="flex items-center gap-1 text-xs capitalize text-muted-foreground">
                      {r.ride_type === 'airport' && <Plane className="size-3" aria-label="Airport" />}
                      {r.category_code} · {r.country_code}
                      {r.flight_number && ` · ${r.flight_number}`}
                    </p>
                  </td>
                  <td className="max-w-64 px-4 py-3">
                    <p className="truncate">{r.pickup_address}</p>
                    <p className="truncate text-muted-foreground">to {r.dropoff_address}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {new Date(r.scheduled_for ?? r.created_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatMoney(Number(r.final_fare ?? r.fare_estimate), r.currency)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLE[r.status as RideStatus])}>
                      {STATUS_LABEL[r.status as RideStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!['completed', 'cancelled'].includes(r.status) && (
                      <form action={adminCancelRide}>
                        <input type="hidden" name="id" value={r.id} />
                        <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                          Cancel<span className="sr-only"> trip {r.id.slice(0, 8)}</span>
                        </Button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
