'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Copy, KeyRound, Loader2, Star, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { fieldClass, formatMoney } from '@/lib/account'
import { errorMessage } from '@/lib/rides'
import { ACTIVE_SHIPMENT_STATUSES, SHIPMENT_STATUS_LABEL, SHIPMENT_STATUS_STYLE, VEHICLE_LABEL, type Shipment, type ShipmentEvent } from '@/lib/shipments'
import { cn } from '@/lib/utils'
import { ShipmentTimeline } from './shipment-timeline'
import { RideMap } from '@/components/rides/ride-map'

type Props = {
  initial: Shipment
  initialEvents: ShipmentEvent[]
  deliveryCode: string | null
  courierName: string | null
  isCustomer: boolean
  locale: string
}

async function load([, id]: [string, string]) {
  const supabase = createClient()
  const [{ data: shipment, error }, { data: events }] = await Promise.all([
    supabase.from('shipments').select('*').eq('id', id).single<Shipment>(),
    supabase.from('shipment_events').select('status, note, created_at').eq('shipment_id', id).order('created_at').returns<ShipmentEvent[]>(),
  ])
  if (error) throw error
  return { shipment: shipment!, events: events ?? [] }
}

export function ShipmentView({ initial, initialEvents, deliveryCode, courierName, isCustomer, locale }: Props) {
  const active = ACTIVE_SHIPMENT_STATUSES.includes(initial.status)
  const { data, mutate } = useSWR(['shipment', initial.id], load, {
    fallbackData: { shipment: initial, events: initialEvents },
    refreshInterval: (d) => (d && ACTIVE_SHIPMENT_STATUSES.includes(d.shipment.status) ? 8000 : 0),
    revalidateOnMount: active,
  })
  const s = data.shipment
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [copied, setCopied] = useState(false)

  async function cancel() {
    if (!confirm('Cancel this delivery?')) return
    setBusy(true)
    setError('')
    const { error } = await createClient().rpc('cancel_shipment', { p_id: s.id, p_reason: null })
    if (error) setError(errorMessage(error))
    await mutate()
    setBusy(false)
  }

  async function rate(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) return
    setBusy(true)
    setError('')
    const { error } = await createClient().rpc('rate_shipment', { p_id: s.id, p_rating: rating, p_review: review || null })
    if (error) setError(errorMessage(error))
    await mutate()
    setBusy(false)
  }

  async function copyCode() {
    await navigator.clipboard.writeText(s.tracking_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const money = (n: number) => formatMoney(n, s.currency, locale)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-3xl font-bold tracking-tight">{s.kind === 'moto' ? 'Parcel delivery' : 'Cargo shipment'}</h1>
            <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', SHIPMENT_STATUS_STYLE[s.status])}>{SHIPMENT_STATUS_LABEL[s.status]}</span>
          </div>
          <button type="button" onClick={copyCode} className="inline-flex w-fit items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-foreground">
            Tracking <span className="font-mono font-semibold text-foreground">{s.tracking_code}</span>
            <Copy className="size-3.5" aria-hidden="true" />
            <span aria-live="polite" className="text-xs text-primary">{copied ? 'Copied' : ''}</span>
          </button>
        </header>

        {isCustomer && deliveryCode && ACTIVE_SHIPMENT_STATUSES.includes(s.status) && (
          <section aria-label="Delivery PIN" className="flex items-center gap-4 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-4">
            <KeyRound className="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Delivery PIN</p>
              <p className="text-sm text-muted-foreground">Share with {s.recipient_name}. The courier enters it to confirm hand-over.</p>
            </div>
            <p className="font-mono text-3xl font-bold tracking-[0.3em] text-primary">{deliveryCode}</p>
          </section>
        )}

        <RideMap
          points={[
            { lat: s.pickup_lat, lng: s.pickup_lng, kind: 'pickup', label: `Pickup: ${s.pickup_address}` },
            { lat: s.dropoff_lat, lng: s.dropoff_lng, kind: 'dropoff', label: `Drop-off: ${s.dropoff_address}` },
          ]}
          center={{ lat: s.pickup_lat, lng: s.pickup_lng }}
          className="h-64"
        />

        <section aria-labelledby="progress" className="rounded-xl border bg-card p-5">
          <h2 id="progress" className="mb-4 font-semibold">Progress</h2>
          <ShipmentTimeline status={s.status} events={data.events.map((e) => ({ status: e.status, note: e.note, at: e.created_at }))} locale={locale} />
        </section>

        {isCustomer && s.status === 'delivered' && (
          <section aria-labelledby="rate" className="rounded-xl border bg-card p-5">
            <h2 id="rate" className="font-semibold">{s.rating ? 'Your rating' : 'Rate your courier'}</h2>
            {s.rating ? (
              <p className="mt-2 flex items-center gap-1" aria-label={`${s.rating} out of 5 stars`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={cn('size-5', i < s.rating! ? 'fill-accent text-accent' : 'text-muted-foreground')} aria-hidden="true" />
                ))}
                {s.review && <span className="ml-2 text-sm text-muted-foreground">{s.review}</span>}
              </p>
            ) : (
              <form onSubmit={rate} className="mt-3 flex flex-col gap-3">
                <div role="radiogroup" aria-label="Rating" className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)} className="rounded p-1">
                      <Star className={cn('size-7', n <= rating ? 'fill-accent text-accent' : 'text-muted-foreground')} aria-hidden="true" />
                    </button>
                  ))}
                </div>
                <label htmlFor="review" className="sr-only">Review</label>
                <textarea id="review" value={review} onChange={(e) => setReview(e.target.value)} rows={2} maxLength={500} placeholder="Anything to share? (optional)" className={cn(fieldClass, 'h-auto py-2')} />
                <Button type="submit" className="w-fit" disabled={!rating || busy}>Submit rating</Button>
              </form>
            )}
          </section>
        )}
      </div>

      <aside className="flex flex-col gap-4">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Courier</h2>
          <p className="mt-2 flex items-center gap-2 text-sm">
            <UserRound className="size-4 text-muted-foreground" aria-hidden="true" />
            {courierName || (s.status === 'requested' ? 'Matching you with a nearby courier…' : 'Not assigned')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{VEHICLE_LABEL[s.vehicle_class]}{s.service_level === 'express' ? ' · Express' : ''}</p>
        </section>

        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Details</h2>
          <dl className="mt-3 flex flex-col gap-3 text-sm">
            {[
              ['From', `${s.sender_name} · ${s.pickup_address}`],
              ['To', `${s.recipient_name} · ${s.dropoff_address}`],
              ['Item', `${s.package_description} · ${Number(s.weight_kg)} kg`],
              ['Scheduled', s.scheduled_for ? new Date(s.scheduled_for).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) : null],
              ['Loading help', s.needs_loaders ? 'Requested' : null],
              ['Notes', s.notes],
              ['Received by', s.delivered_to],
              ['Cancel reason', s.cancel_reason],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="break-words">{v}</dd>
                </div>
              ))}
          </dl>
        </section>

        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Payment</h2>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Distance</dt>
              <dd className="tabular-nums">{Number(s.distance_km).toFixed(1)} km</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Method</dt>
              <dd className="capitalize">{s.payment_method.replace(/_/g, ' ')}</dd>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <dt>{s.final_fare ? 'Total paid' : 'Upfront price'}</dt>
              <dd className="tabular-nums">{money(Number(s.final_fare ?? s.fare_estimate))}</dd>
            </div>
          </dl>
        </section>

        {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        {isCustomer && (s.status === 'requested' || s.status === 'accepted') && (
          <Button variant="outline" onClick={cancel} disabled={busy} className="text-destructive">
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : 'Cancel delivery'}
          </Button>
        )}
      </aside>
    </div>
  )
}
