'use client'

import { useId, useState } from 'react'
import { Loader2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { fieldClass } from '@/lib/account'
import { errorMessage, toLocalInputValue, type RideDetails } from '@/lib/rides'
import { cn } from '@/lib/utils'

type Props = { ride: RideDetails; onChange: () => void }

function useRpc(onChange: () => void) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function run(fn: string, args: Record<string, unknown>) {
    setPending(true)
    setError('')
    const { error } = await createClient().rpc(fn, args)
    setPending(false)
    if (error) {
      setError(errorMessage(error))
      return false
    }
    onChange()
    return true
  }
  return { pending, error, run }
}

export function CancelTrip({ ride, onChange }: Props) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const { pending, error, run } = useRpc(onChange)
  const isDriver = ride.viewer === 'driver'

  if (!open)
    return (
      <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
        {isDriver ? 'Release this trip' : 'Cancel ride'}
      </Button>
    )

  return (
    <div className="flex flex-col gap-2 rounded-xl border p-3">
      <label htmlFor={id} className="text-sm font-medium">
        {isDriver ? 'Why are you releasing this trip?' : 'Reason for cancelling (optional)'}
      </label>
      <input id={id} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} className={fieldClass} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={() => setOpen(false)}>
          Keep ride
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          disabled={pending}
          onClick={() => run('cancel_ride', { p_ride_id: ride.id, p_reason: reason || null })}
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : 'Confirm'}
        </Button>
      </div>
    </div>
  )
}

const NEXT_LABEL: Partial<Record<RideDetails['status'], string>> = {
  accepted: 'Start heading to pickup',
  arriving: 'Rider on board — start trip',
  in_progress: 'Complete trip',
}

export function AdvanceTrip({ ride, onChange }: Props) {
  const { pending, error, run } = useRpc(onChange)
  const label = NEXT_LABEL[ride.status]
  if (!label) return null
  return (
    <div className="flex flex-col gap-2">
      <Button className="h-12 w-full text-base" disabled={pending} onClick={() => run('advance_ride', { p_ride_id: ride.id })}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : label}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

export function RateTrip({ ride, onChange }: Props) {
  const id = useId()
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const { pending, error, run } = useRpc(onChange)

  if (ride.rating) {
    return (
      <div className="rounded-xl border p-4">
        <p className="text-sm font-medium">Your rating</p>
        <p className="mt-1 flex gap-0.5" aria-label={`${ride.rating} out of 5 stars`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className={cn('size-5', n <= ride.rating! ? 'fill-accent text-accent' : 'text-muted-foreground/40')} aria-hidden="true" />
          ))}
        </p>
        {ride.review && <p className="mt-2 text-sm text-muted-foreground">{ride.review}</p>}
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (rating) run('rate_ride', { p_ride_id: ride.id, p_rating: rating, p_review: review || null })
      }}
      className="flex flex-col gap-3 rounded-xl border p-4"
    >
      <fieldset>
        <legend className="text-sm font-medium">How was your trip with {ride.driver?.name ?? 'your driver'}?</legend>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer rounded-md p-1 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/30">
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="sr-only" />
              <Star className={cn('size-7', n <= rating ? 'fill-accent text-accent' : 'text-muted-foreground/40')} aria-hidden="true" />
              <span className="sr-only">{n} star{n > 1 && 's'}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label htmlFor={id} className="sr-only">
        Review
      </label>
      <textarea
        id={id}
        value={review}
        onChange={(e) => setReview(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="Anything to share? (optional)"
        className={cn(fieldClass, 'h-auto py-2')}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={!rating || pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : 'Submit rating'}
      </Button>
    </form>
  )
}

export function RescheduleTrip({ ride, onChange }: Props) {
  const ids = { when: useId(), flight: useId() }
  const [open, setOpen] = useState(false)
  const [when, setWhen] = useState(() => toLocalInputValue(new Date(ride.scheduled_for ?? Date.now() + 3600_000)))
  const [flight, setFlight] = useState(ride.flight_number ?? '')
  const { pending, error, run } = useRpc(onChange)

  if (!open)
    return (
      <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
        Change time or flight
      </Button>
    )

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        const ok = await run('reschedule_airport_ride', {
          p_ride_id: ride.id,
          p_scheduled_for: new Date(when).toISOString(),
          p_flight_number: flight || null,
        })
        if (ok) setOpen(false)
      }}
      className="flex flex-col gap-3 rounded-xl border p-3"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor={ids.when} className="text-xs font-semibold text-muted-foreground">
          New time
        </label>
        <input id={ids.when} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required className={fieldClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={ids.flight} className="text-xs font-semibold text-muted-foreground">
          Flight number
        </label>
        <input id={ids.flight} value={flight} onChange={(e) => setFlight(e.target.value.toUpperCase())} maxLength={9} className={fieldClass} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={() => setOpen(false)}>
          Close
        </Button>
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
