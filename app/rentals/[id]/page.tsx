import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarX2, Check, MapPin, ShieldCheck, Star } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { RentalBooker } from '@/components/rentals/rental-booker'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile } from '@/lib/session'
import { formatMoney, type PaymentMethod } from '@/lib/account'
import { capitalize, driveLabels, formatCapacity, formatRange, KIND_META, RENTAL_SELECT, type RentalVehicle } from '@/lib/rentals'
import { cn } from '@/lib/utils'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const LOCALES: Record<string, string> = { GH: 'en-GH', NG: 'en-NG', CI: 'fr-CI' }

async function getVehicle(id: string) {
  if (!UUID_RE.test(id)) return null
  const supabase = await createClient()
  const { data } = await supabase.from('rental_vehicles').select(RENTAL_SELECT).eq('id', id).maybeSingle<RentalVehicle>()
  return data ? { supabase, v: data } : null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const found = await getVehicle((await params).id)
  if (!found) return { title: 'Rental not found' }
  return { title: `${found.v.title} for rent in ${found.v.city}`, description: found.v.description.slice(0, 155) }
}

export default async function RentalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { id } = await params
  const sp = await searchParams
  const found = await getVehicle(id)
  if (!found) notFound()
  const { supabase, v } = found
  const locale = LOCALES[v.country_code] ?? 'en-GH'
  const now = new Date()
  const horizon = new Date(now.getTime() + 120 * 86400_000)

  const [session, { data: category }, { data: ownerName }, { data: busy }, { data: methods }] = await Promise.all([
    getSessionProfile(),
    supabase.from('rental_categories').select('name').eq('code', v.category_code).maybeSingle<{ name: string }>(),
    supabase.rpc('rental_owner_name', { p_owner: v.owner_id }),
    supabase.rpc('rental_busy', { p_vehicle_id: v.id, p_from: now.toISOString(), p_to: horizon.toISOString() }),
    supabase
      .from('country_payment_methods')
      .select('id, country_code, provider, display_name, is_enabled, sort_order')
      .eq('country_code', v.country_code)
      .eq('is_enabled', true)
      .order('sort_order')
      .returns<PaymentMethod[]>(),
  ])
  const isOwner = session?.user.id && v.owner_id === session.user.id
  const money = (n: number | null) => (n == null ? null : formatMoney(Number(n), v.currency, locale))
  const capacity = formatCapacity(v.load_capacity_kg)

  const specs = [
    ['Category', category?.name ?? capitalize(v.category_code)],
    ['Make & model', `${v.make} ${v.model}`],
    ['Year', String(v.year)],
    ...(v.kind === 'equipment'
      ? [['Power source', capitalize(v.fuel_type)]]
      : [
          ['Transmission', capitalize(v.transmission)],
          ['Fuel', capitalize(v.fuel_type)],
          [v.kind === 'truck' ? 'Cab seats' : 'Seats', String(v.seats)],
        ]),
    ...(capacity ? [[v.kind === 'equipment' ? 'Operating weight / capacity' : 'Load capacity', capacity]] : []),
    ...(v.cargo_volume_m3 ? [['Cargo volume', `${v.cargo_volume_m3} m³`]] : []),
    ['Minimum rental', v.min_hours >= 24 ? `${Math.round(v.min_hours / 24)} day${v.min_hours >= 48 ? 's' : ''}` : `${v.min_hours} hours`],
  ]
  const rates = [
    ['Hourly', money(v.hourly_rate)],
    ['Daily', money(v.daily_rate)],
    ['Weekly', money(v.weekly_rate)],
    ['Monthly', money(v.monthly_rate)],
  ].filter((r): r is [string, string] => Boolean(r[1]))

  return (
    <main id="main" className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
        <Link href={`/rentals?kind=${v.kind}&country=${v.country_code}`} className="hover:text-foreground">
          {KIND_META[v.kind].title}
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-foreground">{v.title}</span>
      </nav>

      {v.status !== 'active' && (
        <p role="status" className="mb-4 rounded-lg bg-accent/15 px-4 py-3 text-sm">
          This listing is <strong>{v.status}</strong> and is only visible to you.{v.review_note ? ` Note: ${v.review_note}` : ''}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-8">
          <section aria-label="Photos" className="grid gap-2 sm:grid-cols-4">
            {v.photos.slice(0, 5).map((src, i) => (
              <div key={src} className={cn('relative overflow-hidden rounded-xl bg-muted', i === 0 ? 'aspect-[4/3] sm:col-span-4' : 'aspect-[4/3]')}>
                <Image src={src} alt={i === 0 ? `${v.title}` : `${v.title}, photo ${i + 1}`} fill priority={i === 0} sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
              </div>
            ))}
          </section>

          <header className="flex flex-col gap-2">
            <h1 className="text-balance font-heading text-3xl font-bold tracking-tight">{v.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="size-4" aria-hidden="true" />{v.pickup_address}</span>
              {v.rating_count > 0 && (
                <span className="flex items-center gap-1 text-foreground">
                  <Star className="size-4 fill-accent text-accent" aria-hidden="true" />
                  {Number(v.rating_avg).toFixed(1)} <span className="text-muted-foreground">({v.rating_count} reviews)</span>
                </span>
              )}
              <span className="flex items-center gap-1"><ShieldCheck className="size-4 text-primary" aria-hidden="true" />{ownerName ?? 'Verified partner'}</span>
            </div>
          </header>

          <p className="text-pretty leading-relaxed">{v.description}</p>

          <section aria-labelledby="specs" className="flex flex-col gap-3">
            <h2 id="specs" className="font-heading text-lg font-semibold">Specifications</h2>
            <dl className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
              {specs.map(([k, val]) => (
                <div key={k} className="flex justify-between gap-3 bg-card px-4 py-3 text-sm">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-medium">{val}</dd>
                </div>
              ))}
            </dl>
          </section>

          {v.features.length > 0 && (
            <section aria-labelledby="features" className="flex flex-col gap-3">
              <h2 id="features" className="font-heading text-lg font-semibold">Features</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {v.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm"><Check className="size-4 text-primary" aria-hidden="true" />{f}</li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="pricing" className="flex flex-col gap-3">
            <h2 id="pricing" className="font-heading text-lg font-semibold">Rates and fees</h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {rates.map(([k, val]) => (
                <div key={k} className="rounded-xl border bg-card p-3">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="font-heading font-semibold">{val}</dd>
                </div>
              ))}
            </dl>
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              <li>Security deposit: <span className="font-medium text-foreground">{money(v.security_deposit)}</span>, refundable after inspection</li>
              <li>Options: <span className="font-medium text-foreground">{driveLabels(v.kind)[v.drive_options]}</span>{v.drive_options !== 'self_drive' && Number(v.driver_daily_fee) > 0 ? ` · ${v.kind === 'equipment' ? 'operator' : 'driver'} ${money(v.driver_daily_fee)}/day` : ''}</li>
              <li>{v.delivery_available ? `Delivery to your address: ${money(v.delivery_fee)}` : 'Pickup from the listed address only'}</li>
              <li>Weekly and monthly rates apply automatically when cheaper.</li>
            </ul>
          </section>

          <section aria-labelledby="availability" className="flex flex-col gap-3">
            <h2 id="availability" className="font-heading text-lg font-semibold">Availability</h2>
            {(busy ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings in the next 120 days. Pick any dates.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {(busy as { start_at: string; end_at: string }[]).map((b) => (
                  <li key={b.start_at} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                    <CalendarX2 className="size-4 text-muted-foreground" aria-hidden="true" />
                    Unavailable {formatRange(b.start_at, b.end_at, locale)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          {isOwner ? (
            <div className="rounded-2xl border bg-card p-5">
              <p className="font-heading font-semibold">This is your listing</p>
              <Link href={`/partner/rentals/${v.id}`} className={cn(buttonVariants(), 'mt-3 h-11 w-full')}>Manage listing</Link>
            </div>
          ) : !session ? (
            <div className="rounded-2xl border bg-card p-5">
              <p className="font-heading text-2xl font-bold">{money(v.daily_rate)}<span className="text-sm font-normal text-muted-foreground"> /day</span></p>
              <p className="mt-2 text-sm text-muted-foreground">Log in to check prices for your dates and book.</p>
              <Link href={`/auth/login?next=${encodeURIComponent(`/rentals/${v.id}`)}`} className={cn(buttonVariants(), 'mt-4 h-11 w-full')}>
                Log in to book
              </Link>
            </div>
          ) : v.status !== 'active' ? (
            <p className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">This listing is not open for bookings.</p>
          ) : (
            <RentalBooker
              vehicle={{
                id: v.id,
                kind: v.kind,
                country_code: v.country_code,
                currency: v.currency,
                drive_options: v.drive_options,
                delivery_available: v.delivery_available,
                min_hours: v.min_hours,
                hourly: v.hourly_rate != null,
              }}
              locale={locale}
              methods={methods ?? []}
              defaultName={session.profile?.full_name ?? ''}
              initialStart={sp.start}
              initialEnd={sp.end}
            />
          )}
        </aside>
      </div>
    </main>
  )
}
