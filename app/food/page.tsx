import type { Metadata } from 'next'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { RestaurantCard } from '@/components/food/restaurant-card'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile } from '@/lib/session'
import { fieldClass } from '@/lib/account'
import { FOOD_COUNTRIES, FOOD_CUISINES, RESTAURANT_SELECT, type Restaurant } from '@/lib/food'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Order food',
  description: "Order from restaurants and food vendors in Ghana, Nigeria and Côte d'Ivoire. Delivery by CHALEGO riders or pickup, with live order tracking.",
}

type Search = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined

export default async function FoodPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  const session = await getSessionProfile()
  const paramCountry = one(sp.country)?.toUpperCase()
  const country = paramCountry && FOOD_COUNTRIES[paramCountry] ? paramCountry : session?.profile?.country_code ?? 'GH'
  const info = FOOD_COUNTRIES[country] ?? FOOD_COUNTRIES.GH
  const city = one(sp.city)?.slice(0, 60)
  const q = one(sp.q)?.slice(0, 60)
  const cuisine = FOOD_CUISINES.find((c) => c === one(sp.cuisine))

  const supabase = await createClient()
  let query = supabase
    .from('restaurants')
    .select(RESTAURANT_SELECT)
    .eq('is_active', true)
    .eq('country_code', country)
    .order('is_open', { ascending: false })
    .order('rating_avg', { ascending: false, nullsFirst: false })
    .limit(60)
  if (city) query = query.ilike('city', `%${city.replace(/[%_,]/g, '')}%`)
  if (q) query = query.ilike('name', `%${q.replace(/[%_,]/g, '')}%`)
  if (cuisine) query = query.contains('cuisines', [cuisine])
  const { data, error } = await query.returns<Restaurant[]>()
  const restaurants = data ?? []
  const base = { country, ...(city ? { city } : {}), ...(q ? { q } : {}) }

  return (
    <main id="main" className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:py-10">
      <header className="mb-6">
        <h1 className="text-balance font-heading text-3xl font-bold tracking-tight md:text-4xl">Hungry? Order from local favourites</h1>
        <p className="mt-1 text-pretty text-muted-foreground">Restaurants and food vendors in {info.name}, delivered by CHALEGO riders or ready for pickup.</p>
      </header>

      <form method="get" action="/food" className="mb-4 grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        {cuisine && <input type="hidden" name="cuisine" value={cuisine} />}
        <Field label="Country">
          <select name="country" defaultValue={country} className={fieldClass}>
            {Object.entries(FOOD_COUNTRIES).map(([code, c]) => <option key={code} value={code}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="City">
          <input name="city" list="food-cities" defaultValue={city} placeholder="Any city" maxLength={60} className={fieldClass} />
        </Field>
        <datalist id="food-cities">
          {info.cities.map((c) => <option key={c} value={c} />)}
        </datalist>
        <Field label="Restaurant name">
          <input name="q" type="search" defaultValue={q} placeholder="Search restaurants" maxLength={60} className={fieldClass} />
        </Field>
        <div className="flex items-end">
          <button type="submit" className={cn(buttonVariants(), 'h-11 w-full px-6')}>Search</button>
        </div>
      </form>

      <nav aria-label="Cuisine" className="mb-8 flex gap-2 overflow-x-auto pb-1">
        {[undefined, ...FOOD_CUISINES].map((c) => (
          <Link
            key={c ?? 'all'}
            href={`/food?${new URLSearchParams({ ...base, ...(c ? { cuisine: c } : {}) }).toString()}`}
            aria-current={c === cuisine ? 'page' : undefined}
            className={cn(
              'shrink-0 rounded-full border px-4 py-2 text-sm font-medium',
              c === cuisine ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {c ?? 'All'}
          </Link>
        ))}
      </nav>

      {error ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">We could not load restaurants right now. Please try again.</p>
      ) : restaurants.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <p className="font-heading text-lg font-semibold">No restaurants match your search</p>
          <p className="mt-1 text-sm text-muted-foreground">Try another city or cuisine.</p>
          <Link href={`/food?country=${country}`} className="mt-4 inline-block text-sm font-medium text-primary hover:underline">Clear filters</Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
            {restaurants.length} restaurant{restaurants.length === 1 ? '' : 's'} found
          </p>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((r) => (
              <li key={r.id}>
                <RestaurantCard r={r} locale={info.locale} />
              </li>
            ))}
          </ul>
        </>
      )}

      <aside className="mt-12 flex flex-col items-start gap-4 rounded-2xl bg-ink p-6 text-ink-foreground md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <h2 className="font-heading text-xl font-semibold">Run a restaurant or food stand?</h2>
          <p className="mt-1 text-sm text-ink-foreground/75">Put your menu online, take orders for delivery or pickup, and let CHALEGO riders handle the last mile.</p>
        </div>
        <Link href="/partner/food" className={cn(buttonVariants(), 'h-11 shrink-0 bg-accent px-5 text-accent-foreground [a]:hover:bg-accent/85')}>
          Partner your restaurant
        </Link>
      </aside>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
      {label}
      {children}
    </label>
  )
}
