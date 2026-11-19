import Image from 'next/image'
import Link from 'next/link'
import { Fuel, Gauge, Star, UserRound, Weight } from 'lucide-react'
import { formatMoney } from '@/lib/account'
import { capitalize, DRIVE_LABELS, formatCapacity, type RentalVehicle } from '@/lib/rentals'

export function RentalCard({ v, locale, categoryName, query }: { v: RentalVehicle; locale: string; categoryName?: string; query?: string }) {
  const capacity = formatCapacity(v.load_capacity_kg)
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-colors hover:border-primary">
      <div className="relative aspect-[4/3] bg-muted">
        {v.photos[0] && (
          <Image src={v.photos[0]} alt={`${v.title} for rent in ${v.city}`} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold">
          {categoryName ?? capitalize(v.category_code)}
        </span>
        {!v.owner_id && (
          <span className="absolute right-3 top-3 rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-ink-foreground">CHALEGO Fleet</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-base font-semibold leading-snug">
              <Link href={`/rentals/${v.id}${query ? `?${query}` : ''}`} className="after:absolute after:inset-0 focus-visible:outline-none">
                {v.title}
              </Link>
            </h3>
            <p className="text-sm text-muted-foreground">{v.city}</p>
          </div>
          {v.rating_count > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
              <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />
              {Number(v.rating_avg).toFixed(1)}
              <span className="sr-only">out of 5 from {v.rating_count} reviews</span>
            </span>
          )}
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {capacity ? (
            <li className="flex items-center gap-1"><Weight className="size-3.5" aria-hidden="true" />{capacity} load</li>
          ) : (
            <li className="flex items-center gap-1"><UserRound className="size-3.5" aria-hidden="true" />{v.seats} seats</li>
          )}
          <li className="flex items-center gap-1"><Gauge className="size-3.5" aria-hidden="true" />{capitalize(v.transmission)}</li>
          <li className="flex items-center gap-1"><Fuel className="size-3.5" aria-hidden="true" />{capitalize(v.fuel_type)}</li>
        </ul>
        <div className="mt-auto flex items-end justify-between gap-2 border-t pt-3">
          <p className="text-xs text-muted-foreground">{DRIVE_LABELS[v.drive_options]}</p>
          <p className="text-right">
            <span className="font-heading text-lg font-bold">{formatMoney(Number(v.daily_rate), v.currency, locale)}</span>
            <span className="text-xs text-muted-foreground"> /day</span>
          </p>
        </div>
      </div>
    </article>
  )
}
