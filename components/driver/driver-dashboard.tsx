'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { ArrowRight, CalendarClock, Loader2, MapPin, Navigation, Plane, Power, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { formatMoney } from '@/lib/account'
import { STATUS_LABEL, errorMessage, type AvailableRide, type RideStatus } from '@/lib/rides'
import { cn } from '@/lib/utils'

type ActiveTrip = { id: string; status: RideStatus; pickup_address: string; dropoff_address: string; scheduled_for: string | null }

type Props = {
  initialOnline: boolean
  categoryName: string
  locale: string
  currency: string
  activeTrips: ActiveTrip[]
  earnings: { today: number; week: number; trips: number }
}

async function loadAvailable() {
  const { data, error } = await createClient().rpc('available_rides')
  if (error) throw error
  return (data ?? []) as AvailableRide[]
}

export function DriverDashboard({ initialOnline, categoryName, locale, currency, activeTrips, earnings }: Props) {
  const router = useRouter()
  const [online, setOnline] = useState(initialOnline)
  const [toggling, setToggling] = useState(false)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const lastSent = useRef(0)

  const { data: rides, mutate, isLoading } = useSWR(online ? 'available-rides' : null, loadAvailable, { refreshInterval: 6000 })

  useEffect(() => {
    if (!online || !navigator.geolocation) return
    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        if (Date.now() - lastSent.current < 15000) return
        lastSent.current = Date.now()
        createClient().rpc('set_driver_status', { p_online: true, p_lat: pos.coords.latitude, p_lng: pos.coords.longitude })
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 },
    )
    return () => navigator.geolocation.clearWatch(watch)
  }, [online])

  async function toggle() {
    setToggling(true)
    setError('')
    const next = !online
    const { error } = await createClient().rpc('set_driver_status', { p_online: next })
    setToggling(false)
    if (error) return setError(errorMessage(error))
    setOnline(next)
  }

  async function act(fn: 'accept_ride' | 'decline_ride', id: string) {
    setBusyId(id)
    setError('')
    const { error } = await createClient().rpc(fn, { p_ride_id: id })
    setBusyId(null)
    if (error) {
      setError(errorMessage(error))
      mutate()
      return
    }
    if (fn === 'accept_ride') router.push(`/account/trips/${id}`)
    else mutate((list) => list?.filter((r) => r.id !== id), { revalidate: false })
  }

  const money = (n: number) => formatMoney(n, currency, locale)

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-label="Availability"
        className={cn(
          'flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between',
          online ? 'bg-primary text-primary-foreground' : 'border bg-card',
        )}
      >
        <div>
          <p className="font-heading text-xl font-semibold">{online ? 'You are online' : 'You are offline'}</p>
          <p className={cn('text-sm', online ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
            {online ? `Receiving ${categoryName} requests near you.` : 'Go online to start receiving trip requests.'}
          </p>
        </div>
        <Button
          onClick={toggle}
          disabled={toggling}
          aria-pressed={online}
          className={cn('h-11 px-5', online && 'bg-primary-foreground text-primary hover:bg-primary-foreground/90')}
        >
          {toggling ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Power data-icon="inline-start" aria-hidden="true" />}
          {online ? 'Go offline' : 'Go online'}
        </Button>
      </section>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <section aria-label="Earnings" className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Today', value: money(earnings.today) },
          { label: 'Last 7 days', value: money(earnings.week) },
          { label: 'Completed trips', value: earnings.trips.toLocaleString(locale) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="font-heading text-2xl font-bold tabular-nums">{s.value}</p>
          </div>
        ))}
      </section>

      {activeTrips.length > 0 && (
        <section aria-labelledby="active-heading">
          <h2 id="active-heading" className="font-heading text-xl font-semibold">Your trips</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {activeTrips.map((t) => (
              <li key={t.id}>
                <Link href={`/account/trips/${t.id}`} className="flex items-center gap-4 rounded-xl border border-primary bg-primary/5 p-4 hover:bg-primary/10">
                  <Navigation className="size-5 shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{t.pickup_address}</span>
                    <span className="block truncate text-sm text-muted-foreground">
                      to {t.dropoff_address}
                      {t.scheduled_for && ` · ${new Date(t.scheduled_for).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}`}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-medium text-primary">{STATUS_LABEL[t.status]}</span>
                  <ArrowRight className="size-4 shrink-0 text-primary" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="requests-heading">
        <h2 id="requests-heading" className="font-heading text-xl font-semibold">Trip requests</h2>
        {!online ? (
          <p className="mt-3 rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">Go online to see requests.</p>
        ) : isLoading ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Looking for requests…
          </p>
        ) : (rides ?? []).length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
            No requests right now. This list refreshes automatically.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3 md:grid-cols-2" aria-live="polite">
            {rides!.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {r.ride_type === 'airport' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/25 px-2 py-0.5 font-semibold text-accent-foreground">
                        <Plane className="size-3" aria-hidden="true" /> {r.flight_number ?? 'Airport'}
                      </span>
                    )}
                    {r.scheduled_for && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                        <CalendarClock className="size-3" aria-hidden="true" />
                        {new Date(r.scheduled_for).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    )}
                    {r.away_km != null && <span className="text-muted-foreground">{Number(r.away_km).toFixed(1)} km away</span>}
                  </div>
                  <span className="font-heading text-lg font-bold tabular-nums">{formatMoney(Number(r.fare_estimate), r.currency, locale)}</span>
                </div>
                <ol className="flex flex-col gap-1.5 text-sm">
                  <li className="flex gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span><span className="sr-only">Pickup: </span>{r.pickup_address}</span>
                  </li>
                  <li className="flex gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden="true" />
                    <span><span className="sr-only">Destination: </span>{r.dropoff_address}</span>
                  </li>
                </ol>
                <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  <span>{Number(r.distance_km).toFixed(1)} km · ~{r.duration_min} min</span>
                  <span className="capitalize">{r.payment_method.replace(/_/g, ' ')}</span>
                  {r.passengers && (
                    <span className="inline-flex items-center gap-0.5">
                      <Users className="size-3" aria-hidden="true" /> {r.passengers} · {r.luggage} bags
                    </span>
                  )}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" disabled={busyId === r.id} onClick={() => act('decline_ride', r.id)}>
                    Decline
                  </Button>
                  <Button className="flex-1" disabled={busyId === r.id} onClick={() => act('accept_ride', r.id)}>
                    {busyId === r.id ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : 'Accept'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
