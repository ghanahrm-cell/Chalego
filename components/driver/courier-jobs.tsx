'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Loader2, MapPin, Package, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { fieldClass, formatMoney } from '@/lib/account'
import { errorMessage } from '@/lib/rides'
import {
  COURIER_NEXT_ACTION,
  SHIPMENT_STATUS_LABEL,
  SHIPMENT_STATUS_STYLE,
  VEHICLE_CLASSES,
  VEHICLE_LABEL,
  type Shipment,
  type VehicleClass,
} from '@/lib/shipments'
import { cn } from '@/lib/utils'

type Props = { courierId: string; deliveryClass: VehicleClass | null; locale: string }

async function loadAvailable() {
  const { data, error } = await createClient().rpc('available_shipments')
  if (error) throw error
  return (data ?? []) as Shipment[]
}

async function loadMine([, id]: [string, string]) {
  const { data, error } = await createClient()
    .from('shipments')
    .select('*')
    .eq('courier_id', id)
    .in('status', ['accepted', 'picked_up', 'in_transit'])
    .order('accepted_at')
    .returns<Shipment[]>()
  if (error) throw error
  return data ?? []
}

export function CourierJobs({ courierId, deliveryClass, locale }: Props) {
  const router = useRouter()
  const [cls, setCls] = useState<VehicleClass | ''>(deliveryClass ?? '')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [pins, setPins] = useState<Record<string, string>>({})
  const enabled = Boolean(deliveryClass)

  const { data: available, mutate: refreshAvailable } = useSWR(enabled ? 'available-shipments' : null, loadAvailable, { refreshInterval: 8000 })
  const { data: mine, mutate: refreshMine } = useSWR(enabled ? ['my-shipments', courierId] : null, loadMine, { refreshInterval: 10000 })

  async function run(id: string, fn: () => PromiseLike<{ error: unknown }>) {
    setBusy(id)
    setError('')
    const { error } = await fn()
    if (error) setError(errorMessage(error))
    await Promise.all([refreshAvailable(), refreshMine()])
    setBusy(null)
  }

  async function saveClass() {
    setBusy('class')
    setError('')
    const { error } = await createClient().rpc('set_delivery_class', { p_class: cls || null })
    if (error) setError(errorMessage(error))
    setBusy(null)
    router.refresh()
  }

  const rpc = createClient()

  return (
    <section aria-labelledby="courier-jobs" className="mt-8 flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="courier-jobs" className="flex items-center gap-2 font-heading text-xl font-bold">
            <Package className="size-5 text-primary" aria-hidden="true" /> Delivery jobs
          </h2>
          <p className="text-sm text-muted-foreground">Earn more between rides by carrying parcels and cargo. Jobs show while you are online.</p>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="delivery-class" className="text-xs font-semibold text-muted-foreground">I can carry with</label>
            <select id="delivery-class" value={cls} onChange={(e) => setCls(e.target.value as VehicleClass | '')} className={cn(fieldClass, 'w-52')}>
              <option value="">Not doing deliveries</option>
              {VEHICLE_CLASSES.map((v) => (
                <option key={v.value} value={v.value}>{v.label} ({v.capacity})</option>
              ))}
            </select>
          </div>
          <Button type="button" variant="outline" className="h-11" onClick={saveClass} disabled={busy === 'class' || cls === (deliveryClass ?? '')}>
            Save
          </Button>
        </div>
      </header>

      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {enabled && (
        <>
          {(mine ?? []).length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold">Your active deliveries</h3>
              {mine!.map((s) => {
                const step = COURIER_NEXT_ACTION[s.status]
                const needsPin = s.status === 'in_transit'
                const heading = s.status === 'accepted' ? 'Collect from' : 'Deliver to'
                const name = s.status === 'accepted' ? s.sender_name : s.recipient_name
                const phone = s.status === 'accepted' ? s.sender_phone : s.recipient_phone
                const address = s.status === 'accepted' ? s.pickup_address : s.dropoff_address
                return (
                  <article key={s.id} className="flex flex-col gap-3 rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{s.tracking_code}</span>
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', SHIPMENT_STATUS_STYLE[s.status])}>{SHIPMENT_STATUS_LABEL[s.status]}</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{heading}</p>
                      <p className="font-medium">{name}</p>
                      <p className="flex items-start gap-1 text-sm text-muted-foreground"><MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />{address}</p>
                      <a href={`tel:${phone.replace(/\s/g, '')}`} className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                        <Phone className="size-3.5" aria-hidden="true" /> {phone}
                      </a>
                    </div>
                    <p className="text-sm">{s.package_description} · {Number(s.weight_kg)} kg{s.needs_loaders ? ' · Loading help needed' : ''}</p>
                    {s.notes && <p className="rounded-lg bg-muted px-3 py-2 text-sm">{s.notes}</p>}
                    <div className="flex flex-wrap items-end gap-2">
                      {needsPin && (
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor={`pin-${s.id}`} className="text-xs font-semibold text-muted-foreground">Recipient PIN</label>
                          <input
                            id={`pin-${s.id}`}
                            inputMode="numeric"
                            pattern="[0-9]{4}"
                            maxLength={4}
                            value={pins[s.id] ?? ''}
                            onChange={(e) => setPins((p) => ({ ...p, [s.id]: e.target.value.replace(/\D/g, '') }))}
                            className={cn(fieldClass, 'w-28 font-mono tracking-widest')}
                          />
                        </div>
                      )}
                      {step && (
                        <Button
                          className="h-11"
                          disabled={busy === s.id || (needsPin && (pins[s.id] ?? '').length !== 4)}
                          onClick={() => run(s.id, () => rpc.rpc('advance_shipment', { p_id: s.id, p_code: pins[s.id] ?? null, p_received_by: null }))}
                        >
                          {busy === s.id ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : step}
                        </Button>
                      )}
                      {s.status === 'accepted' && (
                        <Button variant="outline" className="h-11" disabled={busy === s.id} onClick={() => run(s.id, () => rpc.rpc('cancel_shipment', { p_id: s.id, p_reason: null }))}>
                          Release job
                        </Button>
                      )}
                      <span className="ml-auto font-semibold tabular-nums">{formatMoney(Number(s.fare_estimate), s.currency, locale)}</span>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Open {VEHICLE_LABEL[deliveryClass!].toLowerCase()} jobs</h3>
            {(available ?? []).length === 0 ? (
              <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                No open jobs right now. Make sure you are online; new jobs appear automatically.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {available!.map((s) => (
                  <li key={s.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.pickup_address}</p>
                      <p className="truncate text-sm text-muted-foreground">to {s.dropoff_address}</p>
                      <p className="text-xs text-muted-foreground">
                        {Number(s.distance_km).toFixed(1)} km · {Number(s.weight_kg)} kg{s.service_level === 'express' ? ' · Express' : ''}
                        {s.scheduled_for ? ` · ${new Date(s.scheduled_for).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}` : ''}
                      </p>
                    </div>
                    <span className="font-semibold tabular-nums">{formatMoney(Number(s.fare_estimate), s.currency, locale)}</span>
                    <Button className="h-10" disabled={busy === s.id} onClick={() => run(s.id, () => rpc.rpc('accept_shipment', { p_id: s.id }))}>
                      {busy === s.id ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : 'Accept'}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  )
}
