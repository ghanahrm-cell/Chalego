'use client'

import { useId, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { ArrowUpDown, Clock, Loader2, Route } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { fieldClass, formatMoney, type PaymentMethod } from '@/lib/account'
import { COUNTRY_CENTER, errorMessage, toLocalInputValue, type FareOption, type Place } from '@/lib/rides'
import { FareOptions } from './fare-options'
import { LocationInput } from './location-input'
import { PaymentSelect } from './payment-select'
import { RideMap, type MapPoint } from './ride-map'

type Props = {
  country: string
  locale: string
  methods: PaymentMethod[]
  savedPlaces: Place[]
}

async function estimate([, country, a, b]: [string, string, Place, Place]) {
  const { data, error } = await createClient().rpc('estimate_fares', {
    p_country: country,
    p_pickup_lat: a.lat,
    p_pickup_lng: a.lng,
    p_drop_lat: b.lat,
    p_drop_lng: b.lng,
  })
  if (error) throw error
  return data as FareOption[]
}

export function RideBooker({ country, locale, methods, savedPlaces }: Props) {
  const router = useRouter()
  const scheduleId = useId()
  const [pickup, setPickup] = useState<Place | null>(null)
  const [dropoff, setDropoff] = useState<Place | null>(null)
  const [category, setCategory] = useState('economy')
  const [payment, setPayment] = useState(methods[0]?.provider ?? 'cash')
  const [schedule, setSchedule] = useState(false)
  const [when, setWhen] = useState(() => toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000)))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { data: fares, error: fareError, isLoading } = useSWR(
    pickup && dropoff ? ['fares', country, pickup, dropoff] : null,
    estimate,
    { revalidateOnFocus: false },
  )

  const points = useMemo<MapPoint[]>(() => {
    const p: MapPoint[] = []
    if (pickup) p.push({ ...pickup, kind: 'pickup', label: `Pickup: ${pickup.label}` })
    if (dropoff) p.push({ ...dropoff, kind: 'dropoff', label: `Destination: ${dropoff.label}` })
    return p
  }, [pickup, dropoff])

  const selected = fares?.find((f) => f.category_code === category)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!pickup || !dropoff || !selected) return
    setSubmitting(true)
    setError('')
    const { data, error } = await createClient().rpc('request_ride', {
      p_category: category,
      p_pickup_address: pickup.label,
      p_pickup_lat: pickup.lat,
      p_pickup_lng: pickup.lng,
      p_drop_address: dropoff.label,
      p_drop_lat: dropoff.lat,
      p_drop_lng: dropoff.lng,
      p_payment_method: payment,
      p_scheduled_for: schedule ? new Date(when).toISOString() : null,
    })
    if (error) {
      setError(errorMessage(error))
      setSubmitting(false)
      return
    }
    router.push(`/account/trips/${data}`)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[26rem_1fr]">
      <form onSubmit={submit} className="order-2 flex flex-col gap-5 rounded-2xl border bg-card p-5 lg:order-1">
        <div className="flex flex-col gap-3">
          <LocationInput
            label="Pickup"
            country={country}
            value={pickup}
            onChange={setPickup}
            placeholder="Where should we pick you up?"
            allowCurrentLocation
            savedPlaces={savedPlaces}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setPickup(dropoff)
                setDropoff(pickup)
              }}
              className="-my-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
            >
              <ArrowUpDown className="size-3.5" aria-hidden="true" /> Swap
            </button>
          </div>
          <LocationInput
            label="Destination"
            country={country}
            value={dropoff}
            onChange={setDropoff}
            placeholder="Where to?"
            savedPlaces={savedPlaces}
          />
        </div>

        {pickup && dropoff ? (
          isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Calculating fares…
            </p>
          ) : fareError ? (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage(fareError, 'Could not estimate fares for this trip.')}
            </p>
          ) : fares && fares.length > 0 ? (
            <>
              <p className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Route className="size-4" aria-hidden="true" /> {Number(fares[0].distance_km).toFixed(1)} km
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-4" aria-hidden="true" /> ~{fares[0].duration_min} min
                </span>
              </p>
              <FareOptions options={fares} value={category} onChange={setCategory} locale={locale} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No ride categories are available here yet.</p>
          )
        ) : (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            Enter a pickup and destination to see upfront prices for every vehicle type.
          </p>
        )}

        <PaymentSelect methods={methods} value={payment} onChange={setPayment} />

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} className="size-4 accent-primary" />
            Schedule for later
          </label>
          {schedule && (
            <>
              <label htmlFor={scheduleId} className="sr-only">
                Pickup date and time
              </label>
              <input
                id={scheduleId}
                type="datetime-local"
                value={when}
                min={toLocalInputValue(new Date(Date.now() + 15 * 60 * 1000))}
                onChange={(e) => setWhen(e.target.value)}
                className={fieldClass}
                required
              />
            </>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="h-12 text-base" disabled={!selected || submitting || methods.length === 0}>
          {submitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : selected ? (
            `${schedule ? 'Schedule' : 'Request'} ${selected.name} · ${formatMoney(Number(selected.fare), selected.currency, locale)}`
          ) : (
            'Request ride'
          )}
        </Button>
        <p className="-mt-2 text-center text-xs text-muted-foreground">
          Upfront price. Final fare matches this estimate unless the route changes.
        </p>
      </form>

      <RideMap points={points} center={COUNTRY_CENTER[country] ?? COUNTRY_CENTER.GH} className="order-1 h-72 lg:order-2 lg:h-[36rem]" />
    </div>
  )
}
