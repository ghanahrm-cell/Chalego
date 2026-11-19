import type { Metadata } from 'next'
import Link from 'next/link'
import { BedDouble, Building2, Hotel } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { StayCard } from '@/components/stays/stay-card'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile } from '@/lib/session'
import { fieldClass } from '@/lib/account'
import { addDays, isIsoDate, parseStayKind, STAY_COUNTRIES, STAY_KIND_META, type StaySearchRow } from '@/lib/stays'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Book hotels and apartments',
  description: "Book verified hotels, guesthouses and furnished apartments in Ghana, Nigeria and Côte d'Ivoire. Nightly, weekly and monthly stays with free cancellation before check-in.",
}

type Search = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined

const TABS = [
  { kind: null, label: 'All stays', icon: BedDouble },
  { kind: 'hotel', label: 'Hotels', icon: Hotel },
  { kind: 'apartment', label: 'Apartments', icon: Building2 },
] as const

export default async function StaysPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  const kind = parseStayKind(one(sp.kind))
  const session = await getSessionProfile()
  const paramCountry = one(sp.country)?.toUpperCase()
  const country = paramCountry && STAY_COUNTRIES[paramCountry] ? paramCountry : session?.profile?.country_code ?? 'GH'
  const info = STAY_COUNTRIES[country] ?? STAY_COUNTRIES.GH
  const city = one(sp.city)?.slice(0, 60)
  const checkIn = isIsoDate(one(sp.in)) ? one(sp.in) : undefined
  const rawOut = one(sp.out)
  const checkOut = checkIn && isIsoDate(rawOut) && rawOut > checkIn ? rawOut : undefined
  const guests = Math.min(Math.max(Number(one(sp.guests)) || 1, 1), 30)

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('search_stays', {
    p_country: country,
    p_kind: kind,
    p_city: city ?? null,
    p_in: checkIn ?? null,
    p_out: checkOut ?? null,
    p_guests: guests,
  })
  const stays = (data ?? []) as StaySearchRow[]
  const today = new Date().toISOString().slice(0, 10)
  const carry = new URLSearchParams(
    Object.entries({ in: checkIn, out: checkOut, guests: guests > 1 ? String(guests) : undefined }).filter(
      (e): e is [string, string] => Boolean(e[1]),
    ),
  ).toString()
  const noun = kind ? STAY_KIND_META[kind].noun : 'stay'

  return (
    <main id="main" className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:py-10">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-balance font-heading text-3xl font-bold tracking-tight md:text-4xl">
            {kind ? STAY_KIND_META[kind].heading : 'Find your next stay'}
          </h1>
          <p className="mt-1 text-pretty text-muted-foreground">
            Verified hotels and homes from CHALEGO Stays and approved hosts across {info.name}.
          </p>
        </div>
        <nav aria-label="Stay type" className="flex rounded-xl border bg-card p-1">
          {TABS.map((t) => (
            <Link
              key={t.label}
              href={`/stays?${new URLSearchParams({ ...(t.kind ? { kind: t.kind } : {}), country }).toString()}`}
              aria-current={t.kind === kind ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium sm:px-4',
                t.kind === kind ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <t.icon className="size-4" aria-hidden="true" /> {t.label}
            </Link>
          ))}
        </nav>
      </header>

      <form method="get" action="/stays" className="mb-8 grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
        {kind && <input type="hidden" name="kind" value={kind} />}
        <Field label="Country">
          <select name="country" defaultValue={country} className={fieldClass}>
            {Object.entries(STAY_COUNTRIES).map(([code, c]) => <option key={code} value={code}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="City or area">
          <input name="city" list="stay-cities" defaultValue={city} placeholder="Any city" maxLength={60} className={fieldClass} />
        </Field>
        <datalist id="stay-cities">
          {info.cities.map((c) => <option key={c} value={c} />)}
        </datalist>
        <Field label="Check-in">
          <input type="date" name="in" min={today} defaultValue={checkIn} className={fieldClass} />
        </Field>
        <Field label="Check-out">
          <input type="date" name="out" min={checkIn ? addDays(checkIn, 1) : addDays(today, 1)} defaultValue={checkOut} className={fieldClass} />
        </Field>
        <Field label="Guests">
          <input type="number" name="guests" min={1} max={30} defaultValue={guests} className={fieldClass} />
        </Field>
        <div className="flex items-end">
          <button type="submit" className={cn(buttonVariants(), 'h-11 w-full px-6')}>Search</button>
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-6">
          Add dates to hide properties that are sold out. Prices shown are the lowest nightly rate before tax.
        </p>
      </form>

      {error ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">We could not load stays right now. Please try again.</p>
      ) : stays.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <p className="font-heading text-lg font-semibold">No {noun}s match your search</p>
          <p className="mt-1 text-sm text-muted-foreground">Try other dates, fewer guests or another city.</p>
          <Link href={`/stays?country=${country}`} className="mt-4 inline-block text-sm font-medium text-primary hover:underline">Clear filters</Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
            {stays.length} {noun}{stays.length === 1 ? '' : 's'} {checkIn && checkOut ? 'available for your dates' : 'found'}
          </p>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stays.map((s) => (
              <li key={s.id}>
                <StayCard s={s} locale={info.locale} query={carry} />
              </li>
            ))}
          </ul>
        </>
      )}

      <aside className="mt-12 flex flex-col items-start gap-4 rounded-2xl bg-ink p-6 text-ink-foreground md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <h2 className="font-heading text-xl font-semibold">Run a hotel or host apartments?</h2>
          <p className="mt-1 text-sm text-ink-foreground/75">List your rooms on CHALEGO, set nightly rates and discounts, and confirm every booking yourself.</p>
        </div>
        <Link href="/partner/stays" className={cn(buttonVariants(), 'h-11 shrink-0 bg-accent px-5 text-accent-foreground [a]:hover:bg-accent/85')}>
          List your property
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
