import type { Metadata } from 'next'
import Link from 'next/link'
import { CarFront, Construction, Truck } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { RentalCard } from '@/components/rentals/rental-card'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile } from '@/lib/session'
import { fieldClass } from '@/lib/account'
import { KIND_META, RENTAL_KINDS, parseKind, toIsoFromDate, type RentalCategory, type RentalKind, type RentalVehicle } from '@/lib/rentals'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Rent cars, trucks and heavy equipment',
  description: "Rent verified cars, vans, trucks, excavators, cranes and generators in Ghana, Nigeria and Côte d'Ivoire. Self-drive, with a driver or operator, by the hour, day, week or month.",
}

type Search = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined

const COUNTRY_INFO: Record<string, { name: string; locale: string; cities: string[] }> = {
  GH: { name: 'Ghana', locale: 'en-GH', cities: ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast'] },
  NG: { name: 'Nigeria', locale: 'en-NG', cities: ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano'] },
  CI: { name: "Côte d'Ivoire", locale: 'fr-CI', cities: ['Abidjan', 'Yamoussoukro', 'Bouaké', 'San-Pédro', 'Korhogo'] },
}

export default async function RentalsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  const kind: RentalKind = parseKind(one(sp.kind))
  const session = await getSessionProfile()
  const paramCountry = one(sp.country)?.toUpperCase()
  const country = paramCountry && COUNTRY_INFO[paramCountry] ? paramCountry : session?.profile?.country_code ?? 'GH'
  const info = COUNTRY_INFO[country] ?? COUNTRY_INFO.GH
  const category = one(sp.category)
  const city = one(sp.city)
  const startDate = one(sp.start)
  const endDate = one(sp.end)
  const drive = one(sp.drive)
  const sort = one(sp.sort) ?? 'recommended'
  const max = Number(one(sp.max))

  const supabase = await createClient()
  const [{ data: categories }, { data: vehicleRows, error }] = await Promise.all([
    supabase.from('rental_categories').select('code, kind, name, description, sort_order').eq('kind', kind).order('sort_order').returns<RentalCategory[]>(),
    supabase
      .rpc('search_rentals', {
        p_country: country,
        p_kind: kind,
        p_category: category ?? null,
        p_city: city ?? null,
        p_start: toIsoFromDate(startDate, country),
        p_end: toIsoFromDate(endDate, country),
        p_drive: drive === 'self_drive' || drive === 'with_driver' ? drive : null,
        p_max_daily: Number.isFinite(max) && max > 0 ? max : null,
        p_sort: sort,
      }),
  ])
  const vehicles = (vehicleRows ?? null) as RentalVehicle[] | null
  const catNames = new Map((categories ?? []).map((c) => [c.code, c.name]))
  const meta = KIND_META[kind]
  const today = new Date().toISOString().slice(0, 10)
  const carry = new URLSearchParams(
    Object.entries({ start: startDate, end: endDate }).filter((e): e is [string, string] => Boolean(e[1])),
  ).toString()

  return (
    <main id="main" className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:py-10">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-balance font-heading text-3xl font-bold tracking-tight md:text-4xl">
            {meta.heading}
          </h1>
          <p className="mt-1 text-pretty text-muted-foreground">
            Verified {meta.noun}s from CHALEGO Fleet and approved partners across {info.name}.
          </p>
        </div>
        <nav aria-label="Rental type" className="flex rounded-xl border bg-card p-1">
          {RENTAL_KINDS.map((k) => {
            const Icon = k === 'truck' ? Truck : k === 'equipment' ? Construction : CarFront
            return (
              <Link
                key={k}
                href={`/rentals?kind=${k}&country=${country}`}
                aria-current={k === kind ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
                  k === kind ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-4" aria-hidden="true" /> {KIND_META[k].tab}
              </Link>
            )
          })}
        </nav>
      </header>

      <form method="get" action="/rentals" className="mb-8 grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-7">
        <input type="hidden" name="kind" value={kind} />
        <Field label="Country">
          <select name="country" defaultValue={country} className={fieldClass}>
            {Object.entries(COUNTRY_INFO).map(([code, c]) => <option key={code} value={code}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="City">
          <select name="city" defaultValue={city ?? ''} className={fieldClass}>
            <option value="">All cities</option>
            {info.cities.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Category">
          <select name="category" defaultValue={category ?? ''} className={fieldClass}>
            <option value="">All categories</option>
            {(categories ?? []).map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Pickup date">
          <input type="date" name="start" min={today} defaultValue={startDate} className={fieldClass} />
        </Field>
        <Field label="Return date">
          <input type="date" name="end" min={startDate ?? today} defaultValue={endDate} className={fieldClass} />
        </Field>
        <Field label="Option">
          <select name="drive" defaultValue={drive ?? ''} className={fieldClass}>
            <option value="">Any</option>
            <option value="self_drive">{kind === 'equipment' ? 'Bare hire' : 'Self-drive'}</option>
            <option value="with_driver">{kind === 'equipment' ? 'With operator' : 'With driver'}</option>
          </select>
        </Field>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rental-sort" className="text-xs font-semibold text-muted-foreground">Sort</label>
          <div className="flex gap-2">
            <select id="rental-sort" name="sort" defaultValue={sort} className={fieldClass}>
              <option value="recommended">Recommended</option>
              <option value="price_asc">Lowest price</option>
              <option value="price_desc">Highest price</option>
              <option value="rating">Top rated</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 sm:col-span-2 lg:col-span-7">
          <p className="text-xs text-muted-foreground">Dates filter out {meta.noun}s already booked or blocked by the owner.</p>
          <button type="submit" className={cn(buttonVariants(), 'h-11 px-6')}>Search</button>
        </div>
      </form>

      {error ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">We could not load rentals right now. Please try again.</p>
      ) : (vehicles ?? []).length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <p className="font-heading text-lg font-semibold">No {meta.noun}s match your search</p>
          <p className="mt-1 text-sm text-muted-foreground">Try different dates, another city or remove a filter.</p>
          <Link href={`/rentals?kind=${kind}&country=${country}`} className="mt-4 inline-block text-sm font-medium text-primary hover:underline">Clear filters</Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">{vehicles!.length} {meta.noun}{vehicles!.length === 1 ? '' : 's'} available</p>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles!.map((v) => (
              <li key={v.id} className="flex">
                <div className="w-full"><RentalCard v={v} locale={info.locale} categoryName={catNames.get(v.category_code)} query={carry} /></div>
              </li>
            ))}
          </ul>
        </>
      )}

      <aside className="mt-12 flex flex-col items-start gap-4 rounded-2xl bg-ink p-6 text-ink-foreground md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <h2 className="font-heading text-xl font-semibold">Own a {meta.noun} or run a fleet?</h2>
          <p className="mt-1 text-sm text-ink-foreground/75">List it on CHALEGO, set your own rates and availability, and get paid after every rental.</p>
        </div>
        <Link href="/partner/rentals" className={cn(buttonVariants(), 'h-11 shrink-0 bg-accent px-5 text-accent-foreground [a]:hover:bg-accent/85')}>
          Become a rental partner
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
