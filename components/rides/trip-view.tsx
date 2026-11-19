'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { ArrowLeft, CalendarClock, Car, Luggage, Phone, Plane, Star, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatMoney } from '@/lib/account'
import { ACTIVE_STATUSES, STATUS_LABEL, STATUS_STYLE, type RideDetails } from '@/lib/rides'
import { cn } from '@/lib/utils'
import { RideMap, type MapPoint } from './ride-map'
import { TripChat } from './trip-chat'
import { AdvanceTrip, CancelTrip, RateTrip, RescheduleTrip } from './trip-actions'

const STEPS = ['requested', 'accepted', 'arriving', 'in_progress', 'completed'] as const

async function loadRide([, id]: [string, string]) {
  const { data, error } = await createClient().rpc('ride_details', { p_ride_id: id })
  if (error) throw error
  return data as RideDetails | null
}

export function TripView({ initial, userId, locale }: { initial: RideDetails; userId: string; locale: string }) {
  const { data, mutate } = useSWR(['ride', initial.id], loadRide, {
    fallbackData: initial,
    refreshInterval: (d) => (d && ACTIVE_STATUSES.includes(d.status) ? 4000 : 0),
  })
  const ride = data ?? initial
  const isRider = ride.viewer === 'rider'
  const isDriver = ride.viewer === 'driver'
  const chatOpen = ['accepted', 'arriving', 'in_progress'].includes(ride.status)
  const stepIndex = STEPS.indexOf(ride.status as (typeof STEPS)[number])

  const points = useMemo<MapPoint[]>(() => {
    const p: MapPoint[] = [
      { lat: ride.pickup_lat, lng: ride.pickup_lng, kind: 'pickup', label: `Pickup: ${ride.pickup_address}` },
      { lat: ride.dropoff_lat, lng: ride.dropoff_lng, kind: 'dropoff', label: `Destination: ${ride.dropoff_address}` },
    ]
    if (ride.driver?.lat != null && ride.driver?.lng != null) p.push({ lat: ride.driver.lat, lng: ride.driver.lng, kind: 'driver', label: 'Driver location' })
    return p
  }, [ride])

  const money = (n: number | null) => formatMoney(Number(n ?? 0), ride.currency, locale)
  const other = isDriver ? ride.rider : ride.driver

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={isDriver ? '/driver' : '/account/trips'} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> {isDriver ? 'Driver dashboard' : 'All trips'}
        </Link>
        <span className={cn('rounded-full px-3 py-1 text-sm font-medium', STATUS_STYLE[ride.status])} role="status" aria-live="polite">
          {STATUS_LABEL[ride.status]}
        </span>
      </div>

      <header>
        <h1 className="flex items-center gap-2 font-heading text-2xl font-bold tracking-tight md:text-3xl">
          {ride.ride_type === 'airport' ? <Plane className="size-6 text-primary" aria-hidden="true" /> : <Car className="size-6 text-primary" aria-hidden="true" />}
          {ride.ride_type === 'airport' ? `Airport transfer · ${ride.airport?.iata}` : `${ride.category_name} ride`}
        </h1>
        {ride.scheduled_for && (
          <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
            <CalendarClock className="size-4" aria-hidden="true" />
            {new Date(ride.scheduled_for).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        )}
      </header>

      {ride.status !== 'cancelled' && (
        <ol aria-label="Trip progress" className="grid grid-cols-5 gap-1">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-col gap-1.5">
              <span className={cn('h-1.5 rounded-full', i <= stepIndex ? 'bg-primary' : 'bg-muted')} aria-hidden="true" />
              <span className={cn('text-[11px] leading-tight', i === stepIndex ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                {STATUS_LABEL[s]}
                {i === stepIndex && <span className="sr-only"> (current)</span>}
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-6">
          <RideMap points={points} center={{ lat: ride.pickup_lat, lng: ride.pickup_lng }} className="h-72 md:h-96" />

          <section aria-label="Route" className="rounded-2xl border bg-card p-4">
            <ol className="flex flex-col gap-3">
              <li className="flex gap-3">
                <span className="mt-1.5 size-3 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <span>
                  <span className="block text-xs text-muted-foreground">Pickup</span>
                  {ride.pickup_address}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 size-3 shrink-0 rounded-sm bg-ink" aria-hidden="true" />
                <span>
                  <span className="block text-xs text-muted-foreground">Destination</span>
                  {ride.dropoff_address}
                </span>
              </li>
            </ol>
            {ride.ride_type === 'airport' && (
              <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t pt-4 text-sm">
                {ride.flight_number && (
                  <div className="flex items-center gap-1.5">
                    <dt><Plane className="size-4 text-muted-foreground" aria-label="Flight" /></dt>
                    <dd className="font-medium">{ride.flight_number}</dd>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <dt><Users className="size-4 text-muted-foreground" aria-label="Passengers" /></dt>
                  <dd>{ride.passengers}</dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <dt><Luggage className="size-4 text-muted-foreground" aria-label="Bags" /></dt>
                  <dd>{ride.luggage}</dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <dt className="text-muted-foreground">Service:</dt>
                  <dd className="capitalize">{ride.service_level}</dd>
                </div>
                {ride.notes && (
                  <div className="basis-full">
                    <dt className="text-muted-foreground">Notes</dt>
                    <dd>{ride.notes}</dd>
                  </div>
                )}
              </dl>
            )}
          </section>

          {(chatOpen || ride.status === 'completed') && other && (
            <TripChat rideId={ride.id} userId={userId} canSend={chatOpen && ride.viewer !== 'admin'} otherName={other.name} />
          )}
        </div>

        <aside className="flex flex-col gap-4">
          {ride.driver && !isDriver ? (
            <section aria-label="Your driver" className="rounded-2xl border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your driver</p>
              <p className="mt-2 font-heading text-lg font-semibold">{ride.driver.name}</p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="size-4 fill-accent text-accent" aria-hidden="true" />
                {Number(ride.driver.rating).toFixed(1)} ({ride.driver.rating_count} trips rated)
              </p>
              <p className="mt-3 text-sm">{ride.driver.vehicle}</p>
              <p className="mt-1 inline-block rounded-md border-2 border-foreground px-2 py-0.5 font-mono text-sm font-bold tracking-wider">
                {ride.driver.plate}
              </p>
              {ride.driver.phone && (
                <a href={`tel:${ride.driver.phone}`} className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-primary/10 py-2.5 text-sm font-medium text-primary hover:bg-primary/15">
                  <Phone className="size-4" aria-hidden="true" /> Call driver
                </a>
              )}
            </section>
          ) : isDriver ? (
            <section aria-label="Rider" className="rounded-2xl border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rider</p>
              <p className="mt-2 font-heading text-lg font-semibold">{ride.rider.name}</p>
              {ride.rider.phone && (
                <a href={`tel:${ride.rider.phone}`} className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-primary/10 py-2.5 text-sm font-medium text-primary hover:bg-primary/15">
                  <Phone className="size-4" aria-hidden="true" /> Call rider
                </a>
              )}
            </section>
          ) : ride.status === 'requested' ? (
            <section className="rounded-2xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
              {ride.scheduled_for
                ? 'Your booking is confirmed. A driver will be assigned before pickup.'
                : 'Looking for the nearest available driver. This usually takes under two minutes.'}
            </section>
          ) : null}

          <section aria-labelledby="receipt-heading" className="rounded-2xl border bg-card p-4">
            <h2 id="receipt-heading" className="font-heading font-semibold">
              {ride.status === 'completed' ? 'Receipt' : 'Fare'}
            </h2>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Distance</dt>
                <dd className="tabular-nums">{Number(ride.distance_km).toFixed(1)} km</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Est. duration</dt>
                <dd className="tabular-nums">{ride.duration_min} min</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Payment</dt>
                <dd className="capitalize">{ride.payment_method.replace(/_/g, ' ')}</dd>
              </div>
              {isDriver && ride.status === 'completed' && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Commission</dt>
                    <dd className="tabular-nums">-{money(ride.commission_amount)}</dd>
                  </div>
                  <div className="flex justify-between font-medium">
                    <dt>Your earnings</dt>
                    <dd className="tabular-nums">{money(ride.driver_earnings)}</dd>
                  </div>
                </>
              )}
              <div className="mt-1 flex justify-between border-t pt-3 font-heading text-lg font-semibold">
                <dt>{ride.status === 'completed' ? 'Total paid' : 'Upfront price'}</dt>
                <dd className="tabular-nums">{money(ride.final_fare ?? ride.fare_estimate)}</dd>
              </div>
            </dl>
            <p className="mt-3 font-mono text-[11px] text-muted-foreground">Ref {ride.id.slice(0, 8).toUpperCase()}</p>
          </section>

          {isDriver && <AdvanceTrip ride={ride} onChange={() => mutate()} />}
          {isRider && ride.ride_type === 'airport' && ['requested', 'accepted'].includes(ride.status) && (
            <RescheduleTrip ride={ride} onChange={() => mutate()} />
          )}
          {((isRider && ['requested', 'accepted', 'arriving'].includes(ride.status)) ||
            (isDriver && ['accepted', 'arriving'].includes(ride.status))) && <CancelTrip ride={ride} onChange={() => mutate()} />}
          {isRider && ride.status === 'completed' && <RateTrip ride={ride} onChange={() => mutate()} />}
          {ride.status === 'cancelled' && (
            <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
              Cancelled by {ride.cancelled_by}
              {ride.cancel_reason ? `: ${ride.cancel_reason}` : '.'}
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}
