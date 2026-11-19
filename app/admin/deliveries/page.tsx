import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { fieldClass, formatMoney } from '@/lib/account'
import { requireAdmin } from '@/lib/session'
import { SHIPMENT_STATUS_LABEL, SHIPMENT_STATUS_STYLE, VEHICLE_LABEL, type Shipment, type VehicleClass } from '@/lib/shipments'
import { cn } from '@/lib/utils'
import { adminCancelShipment, updateDeliveryFare } from '../shipment-actions'

const FILTERS = ['active', 'delivered', 'cancelled'] as const
type Filter = (typeof FILTERS)[number]

type Fare = {
  country_code: string
  vehicle_class: VehicleClass
  base_fare: number
  per_km: number
  per_kg: number
  min_fare: number
  max_weight_kg: number
  is_active: boolean
}

export default async function AdminDeliveriesPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { supabase } = await requireAdmin()
  const sp = await searchParams
  const view: Filter = FILTERS.includes(sp.view as Filter) ? (sp.view as Filter) : 'active'

  let query = supabase
    .from('shipments')
    .select('id, tracking_code, kind, vehicle_class, country_code, pickup_address, dropoff_address, weight_kg, fare_estimate, final_fare, commission_amount, currency, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  query = view === 'active' ? query.in('status', ['requested', 'accepted', 'picked_up', 'in_transit']) : query.eq('status', view)

  const [{ data: rows }, { data: stats }, { data: fares }] = await Promise.all([
    query.returns<Shipment[]>(),
    supabase
      .from('shipments')
      .select('final_fare, commission_amount, currency')
      .eq('status', 'delivered')
      .gte('delivered_at', new Date(Date.now() - 30 * 86400_000).toISOString()),
    supabase.from('delivery_fares').select('*').order('country_code').order('max_weight_kg').returns<Fare[]>(),
  ])

  const byCurrency = new Map<string, { gmv: number; commission: number; count: number }>()
  for (const r of stats ?? []) {
    const s = byCurrency.get(r.currency) ?? { gmv: 0, commission: 0, count: 0 }
    s.gmv += Number(r.final_fare ?? 0)
    s.commission += Number(r.commission_amount ?? 0)
    s.count += 1
    byCurrency.set(r.currency, s)
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Deliveries &amp; cargo</h1>
        <p className="mt-1 text-muted-foreground">Parcel and freight operations, last 30 days of revenue, and delivery pricing.</p>
      </header>

      {byCurrency.size > 0 && (
        <section aria-label="Last 30 days" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...byCurrency].map(([cur, s]) => (
            <div key={cur} className="rounded-xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">{cur} · {s.count} delivered</p>
              <p className="font-heading text-2xl font-bold tabular-nums">{formatMoney(s.gmv, cur)}</p>
              <p className="text-sm text-muted-foreground tabular-nums">{formatMoney(s.commission, cur)} commission</p>
            </div>
          ))}
        </section>
      )}

      <nav aria-label="Delivery filter" className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/admin/deliveries?view=${f}`}
            aria-current={f === view ? 'page' : undefined}
            className={cn('shrink-0 rounded-lg px-4 py-2 text-sm font-medium capitalize', f === view ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground')}
          >
            {f}
          </Link>
        ))}
      </nav>

      {(rows ?? []).length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card p-10 text-center text-muted-foreground">No {view} deliveries.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[48rem] text-sm">
            <thead className="border-b text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Shipment</th>
                <th scope="col" className="px-4 py-3 font-medium">Route</th>
                <th scope="col" className="px-4 py-3 font-medium">Fare</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows!.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <Link href={`/account/deliveries/${r.id}`} className="font-mono font-medium hover:underline">{r.tracking_code}</Link>
                    <p className="text-xs text-muted-foreground">{VEHICLE_LABEL[r.vehicle_class]} · {Number(r.weight_kg)} kg · {r.country_code}</p>
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <p className="truncate">{r.pickup_address}</p>
                    <p className="truncate text-muted-foreground">to {r.dropoff_address}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatMoney(Number(r.final_fare ?? r.fare_estimate), r.currency)}
                    {r.commission_amount != null && <p className="text-xs text-muted-foreground">{formatMoney(Number(r.commission_amount), r.currency)} fee</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', SHIPMENT_STATUS_STYLE[r.status])}>{SHIPMENT_STATUS_LABEL[r.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {view === 'active' && (
                      <form action={adminCancelShipment}>
                        <input type="hidden" name="id" value={r.id} />
                        <Button type="submit" variant="outline" size="sm" className="text-destructive">Cancel</Button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section aria-labelledby="delivery-fares" className="flex flex-col gap-4">
        <div>
          <h2 id="delivery-fares" className="font-heading text-xl font-bold">Delivery pricing</h2>
          <p className="text-sm text-muted-foreground">Fare = max(minimum, base + per km x distance + per kg x weight). Moto express adds 40%.</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {(fares ?? []).map((f) => (
            <form key={`${f.country_code}-${f.vehicle_class}`} action={updateDeliveryFare} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
              <input type="hidden" name="country_code" value={f.country_code} />
              <input type="hidden" name="vehicle_class" value={f.vehicle_class} />
              <div className="flex items-center justify-between">
                <p className="font-medium">{f.country_code} · {VEHICLE_LABEL[f.vehicle_class]}</p>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="is_active" defaultChecked={f.is_active} className="size-4 accent-primary" /> Active
                </label>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {(
                  [
                    ['base_fare', 'Base'],
                    ['per_km', 'Per km'],
                    ['per_kg', 'Per kg'],
                    ['min_fare', 'Minimum'],
                    ['max_weight_kg', 'Max kg'],
                  ] as const
                ).map(([name, label]) => (
                  <label key={name} className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
                    {label}
                    <input name={name} type="number" step="any" min={0} defaultValue={Number(f[name])} className={cn(fieldClass, 'h-9 px-2')} required />
                  </label>
                ))}
              </div>
              <Button type="submit" variant="outline" size="sm" className="w-fit">Save</Button>
            </form>
          ))}
        </div>
      </section>
    </div>
  )
}
