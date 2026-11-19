import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { ArrowLeft, Clock, MapPin, Phone, Star } from 'lucide-react'
import { FoodOrdering } from '@/components/food/food-ordering'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile } from '@/lib/session'
import type { PaymentMethod } from '@/lib/account'
import { FOOD_COUNTRIES, hoursLabel, MENU_ITEM_SELECT, RESTAURANT_SELECT, type MenuCategory, type MenuItem, type Restaurant } from '@/lib/food'

const isUuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v)

const load = cache(async (id: string) => {
  if (!isUuid(id)) return null
  const supabase = await createClient()
  const { data } = await supabase.from('restaurants').select(RESTAURANT_SELECT).eq('id', id).maybeSingle<Restaurant>()
  return data ? { supabase, r: data } : null
})

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const found = await load((await params).id)
  if (!found) return { title: 'Restaurant not found' }
  return {
    title: `${found.r.name} · Order online`,
    description: found.r.description?.slice(0, 155) ?? `Order from ${found.r.name} in ${found.r.city} for delivery or pickup on CHALEGO.`,
  }
}

type Review = { rating: number; review: string | null; customer_name: string; created_at: string }

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const found = await load((await params).id)
  if (!found) notFound()
  const { supabase, r } = found
  const locale = FOOD_COUNTRIES[r.country_code]?.locale ?? 'en-GH'

  const [session, { data: cats }, { data: items }, { data: reviews }, { data: methods }] = await Promise.all([
    getSessionProfile(),
    supabase.from('menu_categories').select('id, restaurant_id, name, sort_order').eq('restaurant_id', r.id).order('sort_order').returns<MenuCategory[]>(),
    supabase.from('menu_items').select(MENU_ITEM_SELECT).eq('restaurant_id', r.id).eq('is_active', true).order('sort_order').order('name').returns<MenuItem[]>(),
    supabase.rpc('restaurant_reviews', { p_restaurant: r.id }),
    supabase
      .from('country_payment_methods')
      .select('id, country_code, provider, display_name, is_enabled, sort_order')
      .eq('country_code', r.country_code)
      .eq('is_enabled', true)
      .order('sort_order')
      .returns<PaymentMethod[]>(),
  ])
  const reviewRows = ((reviews ?? []) as Review[]).filter((v) => v.review)

  return (
    <main id="main" className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:py-8">
      <Link href={`/food?country=${r.country_code}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> All restaurants
      </Link>

      <header className="mb-8 overflow-hidden rounded-2xl border bg-card">
        <div className="relative aspect-[16/6] min-h-40 bg-muted">
          <Image src={r.cover_url || '/images/food-jollof.png'} alt="" fill priority sizes="(min-width: 1280px) 1280px, 100vw" className="object-cover" />
        </div>
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between md:p-6">
          <div className="flex items-start gap-4">
            {r.logo_url && (
              <Image src={r.logo_url} alt={`${r.name} logo`} width={72} height={72} className="-mt-14 size-18 shrink-0 rounded-xl border-4 border-card bg-card object-cover" />
            )}
            <div>
              <h1 className="text-balance font-heading text-2xl font-bold tracking-tight md:text-3xl">{r.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{r.cuisines.join(' · ') || 'Restaurant'}</p>
              {r.description && <p className="mt-2 max-w-2xl text-pretty text-sm">{r.description}</p>}
            </div>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {r.rating_count > 0 && (
              <li className="flex items-center gap-1.5 font-medium text-foreground">
                <Star className="size-4 fill-accent text-accent" aria-hidden="true" />
                {Number(r.rating_avg).toFixed(1)} <span className="font-normal text-muted-foreground">({r.rating_count})</span>
              </li>
            )}
            <li className="flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden="true" /> {hoursLabel(r.opens_at, r.closes_at)}
              <span className={r.is_open ? 'font-medium text-primary' : 'font-medium text-destructive'}>{r.is_open ? 'Open' : 'Closed'}</span>
            </li>
            <li className="flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden="true" /> {r.address}, {r.city}
            </li>
            {r.phone && (
              <li>
                <a href={`tel:${r.phone}`} className="flex items-center gap-1.5 hover:text-foreground">
                  <Phone className="size-4" aria-hidden="true" /> {r.phone}
                </a>
              </li>
            )}
          </ul>
        </div>
      </header>

      <FoodOrdering
        restaurant={{
          id: r.id,
          name: r.name,
          country: r.country_code,
          currency: r.currency,
          isOpen: r.is_open,
          offersDelivery: r.offers_delivery,
          offersPickup: r.offers_pickup,
          minOrder: Number(r.min_order),
          isOwn: Boolean(session && r.owner_id === session.user.id),
        }}
        categories={cats ?? []}
        items={(items ?? []).map((i) => ({ ...i, price: Number(i.price) }))}
        methods={methods ?? []}
        locale={locale}
        loggedIn={Boolean(session)}
      />

      {reviewRows.length > 0 && (
        <section aria-labelledby="reviews" className="mt-12">
          <h2 id="reviews" className="mb-4 font-heading text-xl font-semibold">What customers say</h2>
          <ul className="grid gap-4 md:grid-cols-2">
            {reviewRows.slice(0, 6).map((v, i) => (
              <li key={i} className="rounded-2xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{v.customer_name}</p>
                  <p className="flex items-center gap-1 text-sm">
                    <Star className="size-4 fill-accent text-accent" aria-hidden="true" /> {v.rating}
                    <span className="sr-only">out of 5</span>
                  </p>
                </div>
                <p className="mt-2 text-pretty text-sm text-muted-foreground">{v.review}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
