import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Star, UsersRound } from 'lucide-react'
import { formatMoney } from '@/lib/account'
import { STAY_KIND_META, type StaySearchRow } from '@/lib/stays'

export function StayCard({ s, locale, query }: { s: StaySearchRow; locale: string; query?: string }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-colors hover:border-primary">
      <div className="relative aspect-[4/3] bg-muted">
        {s.photos[0] && (
          <Image src={s.photos[0]} alt={`${s.title} in ${s.city}`} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold">
          {s.kind === 'hotel' && s.star_rating ? `${s.star_rating}-star hotel` : STAY_KIND_META[s.kind].tab.slice(0, -1)}
        </span>
        {!s.host_name && (
          <span className="absolute right-3 top-3 rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-ink-foreground">CHALEGO Stays</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-heading text-base font-semibold leading-snug">
              <Link href={`/stays/${s.id}${query ? `?${query}` : ''}`} className="after:absolute after:inset-0 focus-visible:outline-none">
                {s.title}
              </Link>
            </h3>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{s.city}</span>
            </p>
          </div>
          {s.rating_count > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
              <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />
              {Number(s.rating_avg).toFixed(1)}
              <span className="sr-only">out of 5 from {s.rating_count} reviews</span>
            </span>
          )}
        </div>
        {s.amenities.length > 0 && (
          <p className="line-clamp-1 text-xs text-muted-foreground">{s.amenities.slice(0, 4).join(' · ')}</p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 border-t pt-3">
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <UsersRound className="size-3.5" aria-hidden="true" /> Up to {s.max_guests} guests
          </p>
          <p className="text-right">
            <span className="text-xs text-muted-foreground">from </span>
            <span className="font-heading text-lg font-bold">{formatMoney(Number(s.from_price), s.currency, locale)}</span>
            <span className="text-xs text-muted-foreground"> /night</span>
          </p>
        </div>
      </div>
    </article>
  )
}
