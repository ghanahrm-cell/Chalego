import Image from 'next/image'
import Link from 'next/link'
import { Bike, Clock, Star } from 'lucide-react'
import { formatMoney } from '@/lib/account'
import type { Restaurant } from '@/lib/food'
import { cn } from '@/lib/utils'

export function RestaurantCard({ r, locale }: { r: Restaurant; locale: string }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/9] bg-muted">
        <Image
          src={r.cover_url || '/images/food-jollof.png'}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className={cn('object-cover', !r.is_open && 'grayscale')}
        />
        {!r.is_open && (
          <span className="absolute left-3 top-3 rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-ink-foreground">Closed</span>
        )}
        {r.owner_id === null && (
          <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">CHALEGO Kitchen</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading text-lg font-semibold leading-tight">
            <Link href={`/food/${r.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
              {r.name}
            </Link>
          </h3>
          {r.rating_count > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
              <Star className="size-4 fill-accent text-accent" aria-hidden="true" />
              {Number(r.rating_avg).toFixed(1)}
              <span className="sr-only">out of 5 from {r.rating_count} reviews</span>
            </span>
          )}
        </div>
        <p className="line-clamp-1 text-sm text-muted-foreground">
          {r.cuisines.length ? r.cuisines.join(' · ') : 'Restaurant'} · {r.city}
        </p>
        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" /> {r.prep_minutes}–{r.prep_minutes + 20} min
          </span>
          {r.offers_delivery && (
            <span className="flex items-center gap-1">
              <Bike className="size-3.5" aria-hidden="true" /> Delivery
            </span>
          )}
          {r.offers_pickup && <span>Pickup</span>}
          {Number(r.min_order) > 0 && <span>Min {formatMoney(Number(r.min_order), r.currency, locale)}</span>}
        </div>
      </div>
    </article>
  )
}
