'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fieldClass } from '@/lib/account'
import { updateAirportFare, updateRideFare } from '@/app/admin/ride-actions'
import { cn } from '@/lib/utils'

type RideFare = {
  country_code: string
  category_code: string
  base_fare: number
  per_km: number
  per_min: number
  min_fare: number
  booking_fee: number
}

const FIELDS = [
  ['base_fare', 'Base'],
  ['per_km', 'Per km'],
  ['per_min', 'Per min'],
  ['min_fare', 'Minimum'],
  ['booking_fee', 'Booking fee'],
] as const

export function RideFareForm({ fare, label }: { fare: RideFare; label: string }) {
  const [state, action, pending] = useActionState(updateRideFare, null)
  return (
    <form action={action} className="flex flex-col gap-2 px-5 py-4 md:flex-row md:items-end md:gap-3">
      <input type="hidden" name="country_code" value={fare.country_code} />
      <input type="hidden" name="category_code" value={fare.category_code} />
      <p className="font-medium md:w-28 md:pb-2.5">{label}</p>
      <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-5">
        {FIELDS.map(([name, text]) => (
          <label key={name} className="flex flex-col gap-1 text-xs text-muted-foreground">
            {text}
            <input
              name={name}
              type="number"
              step="0.01"
              min={0}
              defaultValue={fare[name]}
              required
              className={cn(fieldClass, 'h-9 tabular-nums')}
              aria-label={`${label} ${text}`}
            />
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" className="h-9" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : 'Save'}
        </Button>
        {state && (
          <span role="status" className={cn('text-xs', state.ok ? 'text-primary' : 'text-destructive')}>
            {state.message}
          </span>
        )}
      </div>
    </form>
  )
}

export function AirportFareForm({ airportId, category, label, fare }: { airportId: string; category: string; label: string; fare: number | null }) {
  const [state, action, pending] = useActionState(updateAirportFare, null)
  return (
    <form action={action} className="flex items-end gap-2">
      <input type="hidden" name="airport_id" value={airportId} />
      <input type="hidden" name="category_code" value={category} />
      <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
        {label}
        <input
          name="fixed_fare"
          type="number"
          step="0.01"
          min={0.01}
          defaultValue={fare ?? ''}
          placeholder="Metered"
          required
          className={cn(fieldClass, 'h-9 tabular-nums', state && !state.ok && 'border-destructive')}
        />
      </label>
      <Button type="submit" size="sm" variant="outline" className="h-9" disabled={pending} aria-label={`Save ${label} fare`}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : state?.ok ? 'Saved' : 'Save'}
      </Button>
    </form>
  )
}
