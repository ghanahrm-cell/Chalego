'use client'

import { Car, Users } from 'lucide-react'
import { formatMoney } from '@/lib/account'
import type { FareOption } from '@/lib/rides'
import { cn } from '@/lib/utils'

type Props = {
  options: FareOption[]
  value: string
  onChange: (code: string) => void
  locale: string
  minSeats?: number
  multiplier?: number
}

export function FareOptions({ options, value, onChange, locale, minSeats = 1, multiplier = 1 }: Props) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-xs font-semibold text-muted-foreground">Choose a vehicle</legend>
      {options.map((o) => {
        const tooSmall = o.seats < minSeats
        const selected = value === o.category_code
        return (
          <label
            key={o.category_code}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-3 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/30',
              selected ? 'border-primary bg-primary/5' : 'hover:border-primary/50',
              tooSmall && 'cursor-not-allowed opacity-50',
            )}
          >
            <input
              type="radio"
              name="category"
              value={o.category_code}
              checked={selected}
              disabled={tooSmall}
              onChange={() => onChange(o.category_code)}
              className="sr-only"
            />
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <Car className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 font-medium">
                {o.name}
                <span className="inline-flex items-center gap-0.5 text-xs font-normal text-muted-foreground">
                  <Users className="size-3" aria-hidden="true" />
                  {o.seats}
                </span>
                {o.is_fixed && (
                  <span className="rounded-full bg-accent/25 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent-foreground">
                    Fixed
                  </span>
                )}
              </span>
              <span className="block truncate text-xs text-muted-foreground">{o.description}</span>
            </span>
            <span className="shrink-0 font-heading font-semibold tabular-nums">
              {formatMoney(Math.round(Number(o.fare) * multiplier * 100) / 100, o.currency, locale)}
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}
