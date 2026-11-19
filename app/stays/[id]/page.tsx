import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BedDouble, Bath, Check, Clock, MapPin, ShieldCheck, Star, UsersRound } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { StayBooker } from '@/components/stays/stay-booker'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile } from '@/lib/session'
import { formatMoney, type PaymentMethod } from '@/lib/account'
import { STAY_COUNTRIES, STAY_KIND_META, STAY_PROPERTY_SELECT, STAY_UNIT_SELECT, type StayProperty, type StayUnit } from '@/lib/stays'
import { cn } from '@/lib/utils'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function getProperty(id: string) {
  if (!UUID_RE.test(id)) return null
  const supabase = await createClient()
  const { data } = await supabase.from('stay_properties').select(STAY_PROPERTY_SELECT).eq('id', id).maybeSingle<StayProperty>()
  return data ? { supabase, p: data } : null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const found = await getProperty((await params).id)
  if (!found) return { title: 'Stay not found' }
  const { p } = found
  return {
    title: `${p.title}, ${p.city}`,
    description: (p.description ?? `${STAY_KIND_META[p.kind].noun} in ${p.city}. Book on CHALEGO.`).slice(0, 155),
  }
}

type Review = { rating: number; review: string | null; guest_name: string; created_at: string }

export default async function StayDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { id } = await params
  const sp = await searchParams
  const found = await getProperty(id)
  if (!found) notFound()
  const { supabase, p } = found
  const locale = STAY_COUNTRIES[p.country_code]?.locale ?? 'en-GH'

  const [session, { data: unitRows }, { data: hostName }, { data: reviewRows }, { data: methods }] = await Promise.all([
    getSessionProfile(),
    supabase.from('stay_units').select(STAY_UNIT_SELECT).eq('property_id', p.id).order('nightly_rate').returns<StayUnit[]>(),
    supabase.rpc('rental_owner_name', { p_owner: p.owner_id }),
    supabase.rpc('stay_reviews', { p_property: p.id }),
    supabase
      .from('country_payment_methods')
      .select('id, country_code, provider, display_name, is_enabled, sort_order')
      .eq('country_code', p.country_code)
      .eq('is_enabled', true)
      .order('sort_order')
      .returns<PaymentMethod[]>(),
  ])
  const units = (unitRows ?? []).filter((u) => u.is_active)
  const reviews = (reviewRows ?? []) as Review[]
  const isOwner = Boolean(session?.user.id && p.owner_id === session.user.id)
  const money = (n: number) => formatMoney(Number(n), p.currency, locale)
  const meta = STAY_KIND_META[p.kind]
  const nextPath = `/stays/${p.id}`

  return (
    <main id="main" className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
        <Link href={`/stays?kind=${p.kind}&country=${p.country_code}`} className="hover:text-foreground">{meta.title}</Link>
        <span aria-hidden="true"> / </span>
        <span className="text-foreground">{p.title}</span>
      </nav>

      {!p.is_active && (
        <p role="status" className="mb-4 rounded-lg bg-accent/15 px-4 py-3 text-sm">
          This property is <strong>hidden</strong> and is only visible to you and CHALEGO admins.
        </p>
      )}

      <section aria-label="Photos" className="mb-8 grid gap-2 sm:grid-cols-4 sm:grid-rows-2">
        {p.photos.length === 0 ? (
          <div className="aspect-[16/7] rounded-xl bg-muted sm:col-span-4 sm:row-span-2" />
        ) : (
          p.photos.slice(0, 5).map((src, i) => (
            <div key={src} className={cn('relative overflow-hidden rounded-xl bg-muted', i === 0 ? 'aspect-[4/3] sm:col-span-2 sm:row-span-2 sm:aspect-auto sm:min-h-80' : 'hidden aspect-[4/3] sm:block')}>
              <Image src={src} alt={i === 0 ? p.title : `${p.title}, photo ${i + 1}`} fill priority={i === 0} sizes={i === 0 ? '(min-width: 640px) 50vw, 100vw' : '25vw'} className="object-cover" />
            </div>
          ))
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-8">
          <header className="flex flex-col gap-2">
            <p className="text-sm font-medium text-primary">
              {p.kind === 'hotel' && p.star_rating ? `${p.star_rating}-star hotel` : p.kind === 'hotel' ? 'Hotel' : 'Apartment'} in {p.city}
            </p>
            <h1 className="text-balance font-heading text-3xl font-bold tracking-tight">{p.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="size-4" aria-hidden="true" />{p.address}</span>
              {p.rating_count > 0 && (
                <a href="#reviews" className="flex items-center gap-1 text-foreground hover:underline">
                  <Star className="size-4 fill-accent text-accent" aria-hidden="true" />
                  {Number(p.rating_avg).toFixed(1)} <span className="text-muted-foreground">({p.rating_count} reviews)</span>
                </a>
              )}
              <span className="flex items-center gap-1"><ShieldCheck className="size-4 text-primary" aria-hidden="true" />{hostName ?? 'CHALEGO Stays'}</span>
            </div>
          </header>

          {p.description && <p className="whitespace-pre-line text-pretty leading-relaxed">{p.description}</p>}

          <section aria-labelledby="rooms-h" className="flex flex-col gap-3">
            <h2 id="rooms-h" className="font-heading text-lg font-semibold">{p.kind === 'hotel' ? 'Rooms' : 'Units'}</h2>
            {units.length === 0 ? (
              <p className="text-sm text-muted-foreground">No {meta.unit}s are open for booking yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {units.map((u) => (
                  <li key={u.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">{u.name}</p>
                      {u.description && <p className="mt-0.5 text-sm text-muted-foreground">{u.description}</p>}
                      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <li className="flex items-center gap-1"><UsersRound className="size-3.5" aria-hidden="true" />Sleeps {u.max_guests}</li>
                        <li className="flex items-center gap-1"><BedDouble className="size-3.5" aria-hidden="true" />{u.bedrooms} bedroom{u.bedrooms === 1 ? '' : 's'} · {u.beds} bed{u.beds === 1 ? '' : 's'}</li>
                        <li className="flex items-center gap-1"><Bath className="size-3.5" aria-hidden="true" />{u.bathrooms} bath{u.bathrooms === 1 ? '' : 's'}</li>
                        {u.min_nights > 1 && <li>Min {u.min_nights} nights</li>}
                        {Number(u.weekly_discount_pct) > 0 && <li>{Number(u.weekly_discount_pct)}% off weekly</li>}
                        {Number(u.monthly_discount_pct) > 0 && <li>{Number(u.monthly_discount_pct)}% off monthly</li>}
                      </ul>
                    </div>
                    <p className="shrink-0 sm:text-right">
                      <span className="font-heading text-lg font-bold">{money(u.nightly_rate)}</span>
                      <span className="text-xs text-muted-foreground"> /night</span>
                      {Number(u.cleaning_fee) > 0 && <span className="block text-xs text-muted-foreground">+ {money(u.cleaning_fee)} cleaning</span>}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {p.amenities.length > 0 && (
            <section aria-labelledby="amenities-h" className="flex flex-col gap-3">
              <h2 id="amenities-h" className="font-heading text-lg font-semibold">Amenities</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {p.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-sm"><Check className="size-4 text-primary" aria-hidden="true" />{a}</li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="rules-h" className="flex flex-col gap-3">
            <h2 id="rules-h" className="font-heading text-lg font-semibold">Good to know</h2>
            <dl className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 bg-card px-4 py-3 text-sm">
                <dt className="flex items-center gap-2 text-muted-foreground"><Clock className="size-4" aria-hidden="true" />Check-in</dt>
                <dd className="font-medium">From {p.check_in_time}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 bg-card px-4 py-3 text-sm">
                <dt className="flex items-center gap-2 text-muted-foreground"><Clock className="size-4" aria-hidden="true" />Check-out</dt>
                <dd className="font-medium">By {p.check_out_time}</dd>
              </div>
            </dl>
            {p.house_rules && <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{p.house_rules}</p>}
            <p className="text-sm text-muted-foreground">Free cancellation until the day before check-in. Bring a valid photo ID for check-in.</p>
          </section>

          <section id="reviews" aria-labelledby="reviews-h" className="flex scroll-mt-24 flex-col gap-3">
            <h2 id="reviews-h" className="font-heading text-lg font-semibold">Guest reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet. Reviews come only from guests who completed a stay.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {reviews.map((r) => (
                  <li key={`${r.created_at}-${r.guest_name}`} className="flex flex-col gap-2 rounded-xl border bg-card p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{r.guest_name}</p>
                      <p className="flex items-center gap-1 text-sm">
                        <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />{r.rating}
                        <span className="sr-only">out of 5</span>
                      </p>
                    </div>
                    {r.review && <p className="text-sm leading-relaxed text-muted-foreground">{r.review}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          {isOwner ? (
            <div className="rounded-2xl border bg-card p-5">
              <p className="font-heading font-semibold">This is your property</p>
              <Link href={`/partner/stays/${p.id}`} className={cn(buttonVariants(), 'mt-3 h-11 w-full')}>Manage property</Link>
            </div>
          ) : !session ? (
            <div className="rounded-2xl border bg-card p-5">
              {units[0] && (
                <p className="font-heading text-2xl font-bold">{money(units[0].nightly_rate)}<span className="text-sm font-normal text-muted-foreground"> /night</span></p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">Log in to check availability for your dates and book.</p>
              <Link href={`/auth/login?next=${encodeURIComponent(nextPath)}`} className={cn(buttonVariants(), 'mt-4 h-11 w-full')}>Log in to book</Link>
            </div>
          ) : !p.is_active ? (
            <p className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">This property is not open for bookings.</p>
          ) : (
            <StayBooker
              units={units.map((u) => ({ id: u.id, name: u.name, max_guests: u.max_guests, nightly_rate: Number(u.nightly_rate), min_nights: u.min_nights }))}
              currency={p.currency}
              locale={locale}
              methods={methods ?? []}
              checkInTime={p.check_in_time}
              initialUnit={sp.unit}
              initialIn={sp.in}
              initialOut={sp.out}
              initialGuests={Number(sp.guests) || 1}
            />
          )}
        </aside>
      </div>
    </main>
  )
}
