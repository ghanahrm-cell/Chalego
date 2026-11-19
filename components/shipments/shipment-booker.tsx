'use client'

import { useId, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Bike, Loader2, Package, Route, Truck, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { fieldClass, formatMoney, type PaymentMethod } from '@/lib/account'
import { COUNTRY_CENTER, errorMessage, toLocalInputValue, type Place } from '@/lib/rides'
import { MOTO_SIZES, VEHICLE_CLASSES, type DeliveryOption, type PackageSize, type VehicleClass } from '@/lib/shipments'
import { cn } from '@/lib/utils'
import { LocationInput } from '@/components/rides/location-input'
import { PaymentSelect } from '@/components/rides/payment-select'
import { RideMap, type MapPoint } from '@/components/rides/ride-map'

type Kind = 'moto' | 'cargo'

type Props = {
  country: string
  locale: string
  currency: string
  methods: PaymentMethod[]
  initialKind: Kind
  sender: { name: string; phone: string }
}

async function estimate([, country, a, b, weight]: [string, string, Place, Place, number]) {
  const { data, error } = await createClient().rpc('estimate_delivery', {
    p_country: country,
    p_pickup_lat: a.lat,
    p_pickup_lng: a.lng,
    p_drop_lat: b.lat,
    p_drop_lng: b.lng,
    p_weight: weight,
  })
  if (error) throw error
  return data as DeliveryOption[]
}

function Field({ label, children, hint }: { label: string; children: (id: string) => React.ReactNode; hint?: string }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-muted-foreground">
        {label}
      </label>
      {children(id)}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function ShipmentBooker({ country, locale, currency, methods, initialKind, sender }: Props) {
  const router = useRouter()
  const [kind, setKind] = useState<Kind>(initialKind)
  const [pickup, setPickup] = useState<Place | null>(null)
  const [dropoff, setDropoff] = useState<Place | null>(null)
  const [size, setSize] = useState<PackageSize>('small')
  const [weight, setWeight] = useState('1')
  const [vehicle, setVehicle] = useState<VehicleClass>('van')
  const [express, setExpress] = useState(false)
  const [senderName, setSenderName] = useState(sender.name)
  const [senderPhone, setSenderPhone] = useState(sender.phone)
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [description, setDescription] = useState('')
  const [declared, setDeclared] = useState('')
  const [loaders, setLoaders] = useState(false)
  const [notes, setNotes] = useState('')
  const [payment, setPayment] = useState(methods[0]?.provider ?? 'cash')
  const [schedule, setSchedule] = useState(false)
  const [when, setWhen] = useState(() => toLocalInputValue(new Date(Date.now() + 2 * 60 * 60 * 1000)))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const weightKg = Number(weight)
  const validWeight = Number.isFinite(weightKg) && weightKg > 0

  const { data: options, error: quoteError, isLoading } = useSWR(
    pickup && dropoff && validWeight ? ['delivery', country, pickup, dropoff, weightKg] : null,
    estimate,
    { revalidateOnFocus: false, keepPreviousData: true },
  )

  const kindOptions = (options ?? []).filter((o) => (kind === 'moto' ? o.vehicle_class === 'moto' : o.vehicle_class !== 'moto'))
  const selected =
    kind === 'moto'
      ? kindOptions[0]
      : (kindOptions.find((o) => o.vehicle_class === vehicle && o.available) ?? kindOptions.find((o) => o.available))
  const isExpress = kind === 'moto' && express
  const price = selected?.available ? Number(isExpress ? selected.express_fare : selected.fare) : null

  const points = useMemo<MapPoint[]>(() => {
    const p: MapPoint[] = []
    if (pickup) p.push({ ...pickup, kind: 'pickup', label: `Pickup: ${pickup.label}` })
    if (dropoff) p.push({ ...dropoff, kind: 'dropoff', label: `Drop-off: ${dropoff.label}` })
    return p
  }, [pickup, dropoff])

  function switchKind(next: Kind) {
    setKind(next)
    setError('')
    if (next === 'moto') {
      setSize('small')
      setWeight('1')
    } else {
      setSize('large')
      setWeight('200')
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!pickup || !dropoff || !selected?.available) return
    setSubmitting(true)
    setError('')
    const { data, error } = await createClient().rpc('request_shipment', {
      p_vehicle_class: selected.vehicle_class,
      p_service_level: isExpress ? 'express' : 'standard',
      p_pickup_address: pickup.label,
      p_pickup_lat: pickup.lat,
      p_pickup_lng: pickup.lng,
      p_sender_name: senderName,
      p_sender_phone: senderPhone,
      p_drop_address: dropoff.label,
      p_drop_lat: dropoff.lat,
      p_drop_lng: dropoff.lng,
      p_recipient_name: recipientName,
      p_recipient_phone: recipientPhone,
      p_description: description,
      p_size: size,
      p_weight: weightKg,
      p_declared_value: declared ? Number(declared) : null,
      p_needs_loaders: kind === 'cargo' && loaders,
      p_notes: notes,
      p_payment_method: payment,
      p_scheduled_for: schedule ? new Date(when).toISOString() : null,
    })
    if (error) {
      setError(errorMessage(error))
      setSubmitting(false)
      return
    }
    router.push(`/account/deliveries/${data}`)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[28rem_1fr]">
      <form onSubmit={submit} className="order-2 flex flex-col gap-6 rounded-2xl border bg-card p-5 lg:order-1">
        <div role="radiogroup" aria-label="Delivery type" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {(
            [
              { value: 'moto', label: 'Parcel', hint: 'Motorbike', icon: Bike },
              { value: 'cargo', label: 'Cargo', hint: 'Van or truck', icon: Truck },
            ] as const
          ).map(({ value, label, hint, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={kind === value}
              onClick={() => switchKind(value)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                kind === value ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
              <span className="hidden text-xs font-normal text-muted-foreground sm:inline">· {hint}</span>
            </button>
          ))}
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-semibold">Route</legend>
          <LocationInput label="Pickup" country={country} value={pickup} onChange={setPickup} placeholder="Where do we collect it?" allowCurrentLocation />
          <LocationInput label="Drop-off" country={country} value={dropoff} onChange={setDropoff} placeholder="Where is it going?" />
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-semibold">What are you sending?</legend>
          <Field label="Description">
            {(id) => (
              <input
                id={id}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={kind === 'moto' ? 'e.g. Signed contract, phone charger' : 'e.g. 40 bags of cement'}
                className={fieldClass}
                minLength={3}
                maxLength={300}
                required
              />
            )}
          </Field>
          {kind === 'moto' ? (
            <div role="radiogroup" aria-label="Package size" className="grid grid-cols-3 gap-2">
              {MOTO_SIZES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  role="radio"
                  aria-checked={size === s.value}
                  onClick={() => {
                    setSize(s.value)
                    setWeight(String(s.weight))
                  }}
                  className={cn(
                    'flex flex-col items-start rounded-lg border p-3 text-left transition-colors',
                    size === s.value ? 'border-primary bg-primary/5' : 'hover:border-primary/50',
                  )}
                >
                  <span className="text-sm font-medium">{s.label}</span>
                  <span className="text-xs text-muted-foreground">{s.hint}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Total weight (kg)">
                {(id) => (
                  <input id={id} type="number" inputMode="decimal" min={1} max={10000} step="any" value={weight} onChange={(e) => setWeight(e.target.value)} className={fieldClass} required />
                )}
              </Field>
              <Field label={`Declared value (${currency})`}>
                {(id) => (
                  <input id={id} type="number" inputMode="decimal" min={0} step="any" value={declared} onChange={(e) => setDeclared(e.target.value)} placeholder="Optional" className={fieldClass} />
                )}
              </Field>
            </div>
          )}
        </fieldset>

        {pickup && dropoff ? (
          isLoading && !options ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Calculating delivery fee…
            </p>
          ) : quoteError ? (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage(quoteError, 'Could not price this delivery.')}
            </p>
          ) : kindOptions.length > 0 ? (
            <section aria-label="Vehicle and price" className="flex flex-col gap-3">
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Route className="size-4" aria-hidden="true" /> {Number(kindOptions[0].distance_km).toFixed(1)} km by road (estimated)
              </p>
              {kind === 'moto' ? (
                selected?.available ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: false, label: 'Standard', hint: 'Same day', amount: selected.fare },
                      { value: true, label: 'Express', hint: 'Direct, no stops', amount: selected.express_fare },
                    ].map((o) => (
                      <button
                        key={o.label}
                        type="button"
                        aria-pressed={express === o.value}
                        onClick={() => setExpress(o.value)}
                        className={cn(
                          'flex flex-col items-start rounded-lg border p-3 text-left transition-colors',
                          express === o.value ? 'border-primary bg-primary/5' : 'hover:border-primary/50',
                        )}
                      >
                        <span className="flex items-center gap-1 text-sm font-medium">
                          {o.value && <Zap className="size-3.5 text-accent-foreground" aria-hidden="true" />}
                          {o.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{o.hint}</span>
                        <span className="mt-1 font-semibold tabular-nums">{formatMoney(Number(o.amount), currency, locale)}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                    This is too far or too heavy for a motorbike. Switch to Cargo for a van or truck.
                  </p>
                )
              ) : (
                <ul role="radiogroup" aria-label="Vehicle" className="flex flex-col gap-2">
                  {kindOptions.map((o) => {
                    const meta = VEHICLE_CLASSES.find((v) => v.value === o.vehicle_class)!
                    const isSelected = selected?.vehicle_class === o.vehicle_class
                    return (
                      <li key={o.vehicle_class}>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          disabled={!o.available}
                          onClick={() => setVehicle(o.vehicle_class)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                            isSelected ? 'border-primary bg-primary/5' : 'enabled:hover:border-primary/50',
                          )}
                        >
                          <Truck className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium">{meta.label}</span>
                            <span className="block text-xs text-muted-foreground">{o.available ? meta.capacity : `Max ${Number(o.max_weight_kg).toLocaleString(locale)} kg`}</span>
                          </span>
                          <span className="font-semibold tabular-nums">{o.available ? formatMoney(Number(o.fare), currency, locale) : 'Too heavy'}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          ) : (
            <p className="text-sm text-muted-foreground">Delivery is not available in this country yet.</p>
          )
        ) : (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">Add a pickup and drop-off to see an instant delivery fee.</p>
        )}

        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="mb-2 text-sm font-semibold">Contacts</legend>
          <Field label="Sender name">
            {(id) => <input id={id} value={senderName} onChange={(e) => setSenderName(e.target.value)} className={fieldClass} autoComplete="name" required minLength={2} maxLength={80} />}
          </Field>
          <Field label="Sender phone">
            {(id) => <input id={id} type="tel" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} className={fieldClass} autoComplete="tel" required pattern="\+?[0-9 ]{7,20}" />}
          </Field>
          <Field label="Recipient name">
            {(id) => <input id={id} value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className={fieldClass} required minLength={2} maxLength={80} />}
          </Field>
          <Field label="Recipient phone">
            {(id) => <input id={id} type="tel" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} className={fieldClass} required pattern="\+?[0-9 ]{7,20}" />}
          </Field>
        </fieldset>

        <Field label="Notes for the courier">
          {(id) => (
            <textarea
              id={id}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Gate code, floor, fragile items…"
              className={cn(fieldClass, 'h-auto py-2')}
            />
          )}
        </Field>

        {kind === 'cargo' && (
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={loaders} onChange={(e) => setLoaders(e.target.checked)} className="size-4 accent-primary" />
            I need help loading and unloading
          </label>
        )}

        <PaymentSelect methods={methods} value={payment} onChange={setPayment} />

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} className="size-4 accent-primary" />
            Schedule pickup for later
          </label>
          {schedule && (
            <Field label="Pickup date and time">
              {(id) => (
                <input
                  id={id}
                  type="datetime-local"
                  value={when}
                  min={toLocalInputValue(new Date(Date.now() + 15 * 60 * 1000))}
                  onChange={(e) => setWhen(e.target.value)}
                  className={fieldClass}
                  required
                />
              )}
            </Field>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="h-12 text-base" disabled={price === null || submitting || methods.length === 0}>
          {submitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <>
              <Package data-icon="inline-start" aria-hidden="true" />
              {price !== null ? `Book delivery · ${formatMoney(price, currency, locale)}` : 'Book delivery'}
            </>
          )}
        </Button>
        <p className="-mt-3 text-center text-xs text-muted-foreground">
          {"You'll get a 4-digit PIN. Share it with the recipient — the courier needs it to complete the delivery."}
        </p>
      </form>

      <RideMap points={points} center={COUNTRY_CENTER[country] ?? COUNTRY_CENTER.GH} className="order-1 h-72 lg:order-2 lg:sticky lg:top-24 lg:h-[36rem]" />
    </div>
  )
}
