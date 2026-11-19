'use client'

import { useId, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Loader2, PlaneLanding, PlaneTakeoff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { fieldClass, formatMoney, type PaymentMethod } from '@/lib/account'
import { SERVICE_LEVELS, errorMessage, toLocalInputValue, type Airport, type FareOption, type Place } from '@/lib/rides'
import { cn } from '@/lib/utils'
import { FareOptions } from './fare-options'
import { LocationInput } from './location-input'
import { PaymentSelect } from './payment-select'
import { RideMap, type MapPoint } from './ride-map'

type Direction = 'from_airport' | 'to_airport'

async function estimate([, airportId, place]: [string, string, Place]) {
  const { data, error } = await createClient().rpc('estimate_airport_fares', {
    p_airport_id: airportId,
    p_lat: place.lat,
    p_lng: place.lng,
  })
  if (error) throw error
  return data as FareOption[]
}

export function AirportBooker({ airports, methods, locale }: { airports: Airport[]; methods: PaymentMethod[]; locale: string }) {
  const router = useRouter()
  const ids = { airport: useId(), flight: useId(), when: useId(), pax: useId(), bags: useId(), level: useId(), notes: useId() }
  const [airportId, setAirportId] = useState(airports[0]?.id ?? '')
  const [direction, setDirection] = useState<Direction>('from_airport')
  const [place, setPlace] = useState<Place | null>(null)
  const [flight, setFlight] = useState('')
  const [when, setWhen] = useState(() => toLocalInputValue(new Date(Date.now() + 3 * 60 * 60 * 1000)))
  const [passengers, setPassengers] = useState(1)
  const [luggage, setLuggage] = useState(1)
  const [level, setLevel] = useState<string>('standard')
  const [category, setCategory] = useState('comfort')
  const [payment, setPayment] = useState(methods[0]?.provider ?? 'cash')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const airport = airports.find((a) => a.id === airportId)
  const { data: fares, error: fareError, isLoading } = useSWR(
    airport && place ? ['airport-fares', airport.id, place] : null,
    estimate,
    { revalidateOnFocus: false },
  )

  const points = useMemo<MapPoint[]>(() => {
    const p: MapPoint[] = []
    if (!airport) return p
    const ap = { lat: airport.lat, lng: airport.lng, label: `${airport.name} (${airport.iata})` }
    if (direction === 'from_airport') {
      p.push({ ...ap, kind: 'pickup' })
      if (place) p.push({ ...place, kind: 'dropoff' })
    } else {
      if (place) p.push({ ...place, kind: 'pickup' })
      p.push({ ...ap, kind: 'dropoff' })
    }
    return p
  }, [airport, place, direction])

  const multiplier = level === 'vip' ? 1.5 : 1
  const selected = fares?.find((f) => f.category_code === category)
  const selectedTooSmall = selected ? selected.seats < passengers : false

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!airport || !place || !selected || selectedTooSmall) return
    setSubmitting(true)
    setError('')
    const { data, error } = await createClient().rpc('request_airport_ride', {
      p_airport_id: airport.id,
      p_direction: direction,
      p_category: category,
      p_address: place.label,
      p_lat: place.lat,
      p_lng: place.lng,
      p_flight_number: flight || null,
      p_scheduled_for: new Date(when).toISOString(),
      p_passengers: passengers,
      p_luggage: luggage,
      p_service_level: level,
      p_payment_method: payment,
      p_notes: notes || null,
    })
    if (error) {
      setError(errorMessage(error))
      setSubmitting(false)
      return
    }
    router.push(`/account/trips/${data}`)
  }

  if (airports.length === 0) {
    return <p className="rounded-xl border border-dashed bg-card p-8 text-center text-muted-foreground">No airports are available in your country yet.</p>
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[28rem_1fr]">
      <form onSubmit={submit} className="order-2 flex flex-col gap-5 rounded-2xl border bg-card p-5 lg:order-1">
        <div role="radiogroup" aria-label="Transfer direction" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {(
            [
              { v: 'from_airport', label: 'Airport pickup', Icon: PlaneLanding },
              { v: 'to_airport', label: 'Airport drop-off', Icon: PlaneTakeoff },
            ] as const
          ).map(({ v, label, Icon }) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={direction === v}
              onClick={() => setDirection(v)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                direction === v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={ids.airport} className="text-xs font-semibold text-muted-foreground">
            Airport
          </label>
          <select id={ids.airport} value={airportId} onChange={(e) => setAirportId(e.target.value)} className={fieldClass}>
            {airports.map((a) => (
              <option key={a.id} value={a.id}>{`${a.name} (${a.iata}), ${a.city}`}</option>
            ))}
          </select>
        </div>

        {airport && (
          <LocationInput
            key={airport.country_code}
            label={direction === 'from_airport' ? 'Drop-off address' : 'Pickup address'}
            country={airport.country_code}
            value={place}
            onChange={setPlace}
            placeholder="Hotel, home or office"
            allowCurrentLocation={direction === 'to_airport'}
          />
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={ids.flight} className="text-xs font-semibold text-muted-foreground">
              Flight number {direction === 'to_airport' && <span className="font-normal">(optional)</span>}
            </label>
            <input
              id={ids.flight}
              value={flight}
              onChange={(e) => setFlight(e.target.value.toUpperCase())}
              placeholder="e.g. KQ512"
              pattern="[A-Za-z0-9]{2,3}\s?[0-9]{1,4}[A-Za-z]?"
              maxLength={9}
              required={direction === 'from_airport'}
              className={cn(fieldClass, 'uppercase')}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={ids.when} className="text-xs font-semibold text-muted-foreground">
              {direction === 'from_airport' ? 'Landing time' : 'Pickup time'}
            </label>
            <input
              id={ids.when}
              type="datetime-local"
              value={when}
              min={toLocalInputValue(new Date(Date.now() + 15 * 60 * 1000))}
              onChange={(e) => setWhen(e.target.value)}
              required
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={ids.pax} className="text-xs font-semibold text-muted-foreground">
              Passengers
            </label>
            <input
              id={ids.pax}
              type="number"
              min={1}
              max={14}
              value={passengers}
              onChange={(e) => setPassengers(Math.max(1, Math.min(14, Number(e.target.value) || 1)))}
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={ids.bags} className="text-xs font-semibold text-muted-foreground">
              Bags
            </label>
            <input
              id={ids.bags}
              type="number"
              min={0}
              max={20}
              value={luggage}
              onChange={(e) => setLuggage(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={ids.level} className="text-xs font-semibold text-muted-foreground">
            Service level
          </label>
          <select id={ids.level} value={level} onChange={(e) => setLevel(e.target.value)} className={fieldClass}>
            {SERVICE_LEVELS.map((s) => (
              <option key={s.value} value={s.value}>{`${s.label} — ${s.hint}`}</option>
            ))}
          </select>
        </div>

        {place ? (
          isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Calculating fares…
            </p>
          ) : fareError ? (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage(fareError, 'Could not estimate fares for this address.')}
            </p>
          ) : fares ? (
            <FareOptions options={fares} value={category} onChange={setCategory} locale={locale} minSeats={passengers} multiplier={multiplier} />
          ) : null
        ) : (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            Add your address to see fixed airport prices. Most city addresses qualify for a flat fare.
          </p>
        )}

        <PaymentSelect methods={methods} value={payment} onChange={setPayment} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor={ids.notes} className="text-xs font-semibold text-muted-foreground">
            Notes for your driver <span className="font-normal">(optional)</span>
          </label>
          <textarea
            id={ids.notes}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="Terminal, child seat, name for the sign…"
            className={cn(fieldClass, 'h-auto py-2')}
          />
        </div>

        {selectedTooSmall && (
          <p className="text-sm text-destructive">This vehicle seats {selected?.seats}. Choose a larger vehicle.</p>
        )}
        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="h-12 text-base" disabled={!selected || selectedTooSmall || submitting || methods.length === 0}>
          {submitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : selected ? (
            `Book ${selected.name} · ${formatMoney(Math.round(Number(selected.fare) * multiplier * 100) / 100, selected.currency, locale)}`
          ) : (
            'Book transfer'
          )}
        </Button>
        <p className="-mt-2 text-center text-xs text-muted-foreground">
          We track your flight. Free waiting for 60 minutes after landing.
        </p>
      </form>

      {airport && (
        <RideMap points={points} center={{ lat: airport.lat, lng: airport.lng }} className="order-1 h-72 lg:order-2 lg:h-[44rem]" />
      )}
    </div>
  )
}
