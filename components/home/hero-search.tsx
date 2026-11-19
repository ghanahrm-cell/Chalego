'use client'

import { useState } from 'react'
import { BookingForm } from '@/components/booking-form'
import { DIVISIONS } from '@/lib/divisions'
import { cn } from '@/lib/utils'

export function HeroSearch() {
  const [active, setActive] = useState(DIVISIONS[0].slug)

  return (
    <div className="rounded-2xl bg-card p-3 shadow-2xl ring-1 ring-black/5 md:p-5">
      <div role="tablist" aria-label="Choose a service" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-3">
        {DIVISIONS.map((d) => {
          const selected = d.slug === active
          return (
            <button
              key={d.slug}
              type="button"
              role="tab"
              id={`tab-${d.slug}`}
              aria-selected={selected}
              aria-controls="hero-search-panel"
              onClick={() => setActive(d.slug)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                selected ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <d.icon className="size-4" aria-hidden="true" />
              {d.shortName}
            </button>
          )
        })}
      </div>
      <div id="hero-search-panel" role="tabpanel" aria-labelledby={`tab-${active}`} className="border-t pt-4">
        <BookingForm key={active} slug={active} compact />
      </div>
    </div>
  )
}
