import Link from 'next/link'
import { Bike, ChevronRight, Package, Truck } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { formatMoney } from '@/lib/account'
import { requireUser } from '@/lib/session'
import { SHIPMENT_STATUS_LABEL, SHIPMENT_STATUS_STYLE, VEHICLE_LABEL, type Shipment } from '@/lib/shipments'
import { cn } from '@/lib/utils'

type Row = Pick<
  Shipment,
  'id' | 'tracking_code' | 'kind' | 'vehicle_class' | 'dropoff_address' | 'recipient_name' | 'fare_estimate' | 'final_fare' | 'currency' | 'status' | 'scheduled_for' | 'created_at'
>

export default async function DeliveriesPage() {
  const { supabase, user, country } = await requireUser('/account/deliveries')
  const locale = country?.locale ?? 'en-GH'

  const { data: rows } = await supabase
    .from('shipments')
    .select('id, tracking_code, kind, vehicle_class, dropoff_address, recipient_name, fare_estimate, final_fare, currency, status, scheduled_for, created_at')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
    .returns<Row[]>()

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">My deliveries</h1>
          <p className="mt-1 text-muted-foreground">Parcels and cargo you have sent, with tracking and receipts.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/send" className={cn(buttonVariants(), 'h-10')}>
            <Bike data-icon="inline-start" aria-hidden="true" /> Send parcel
          </Link>
          <Link href="/send?kind=cargo" className={cn(buttonVariants({ variant: 'outline' }), 'h-10')}>
            <Truck data-icon="inline-start" aria-hidden="true" /> Move cargo
          </Link>
        </div>
      </header>

      {(rows ?? []).length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed bg-card px-6 py-12 text-center">
          <Package className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 font-medium">No deliveries yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">Send your first parcel and track it here from pickup to doorstep.</p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {rows!.map((r) => (
            <li key={r.id}>
              <Link href={`/account/deliveries/${r.id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  {r.kind === 'moto' ? <Bike className="size-5" aria-hidden="true" /> : <Truck className="size-5" aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">To {r.recipient_name} · {r.dropoff_address}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    <span className="font-mono">{r.tracking_code}</span> · {VEHICLE_LABEL[r.vehicle_class]} ·{' '}
                    {new Date(r.scheduled_for ?? r.created_at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-semibold tabular-nums">{formatMoney(Number(r.final_fare ?? r.fare_estimate), r.currency, locale)}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', SHIPMENT_STATUS_STYLE[r.status])}>{SHIPMENT_STATUS_LABEL[r.status]}</span>
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
