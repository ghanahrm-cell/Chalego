import Image from 'next/image'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { OwnerApplication } from '@/components/rentals/owner-application'
import { requireUser } from '@/lib/session'
import { formatMoney } from '@/lib/account'
import { formatRange, LISTING_STATUS_STYLES, RENTAL_STATUS_STYLES, type RentalStatus, type RentalVehicle } from '@/lib/rentals'
import { cn } from '@/lib/utils'

type Owner = {
  owner_type: 'individual' | 'fleet'
  business_name: string
  registration_number: string | null
  phone: string
  city: string
  payout_details: string | null
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  review_note: string | null
}
type Booking = {
  id: string
  reference: string
  vehicle_id: string
  status: RentalStatus
  start_at: string
  end_at: string
  total_amount: number
  owner_earnings: number | null
  currency: string
}

export default async function PartnerRentalsPage() {
  const { supabase, user, profile, country } = await requireUser('/partner/rentals')
  const locale = country?.locale ?? 'en-GH'
  const { data: owner } = await supabase
    .from('rental_owners')
    .select('owner_type, business_name, registration_number, phone, city, payout_details, status, review_note')
    .eq('id', user.id)
    .maybeSingle<Owner>()

  if (!owner || owner.status !== 'approved') {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <header>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Earn with your vehicles</h1>
          <p className="mt-1 text-muted-foreground">
            List cars, vans, buses or trucks on CHALEGO. You set the rates and availability; we bring verified renters.
          </p>
        </header>
        {owner?.status === 'pending' && (
          <p role="status" className="rounded-lg bg-accent/15 px-4 py-3 text-sm">Your application is under review. We usually respond within 2 business days.</p>
        )}
        {owner?.status === 'rejected' && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Your application was not approved{owner.review_note ? `: ${owner.review_note}` : '.'} Update your details and resubmit.
          </p>
        )}
        {owner?.status === 'suspended' ? (
          <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Your partner account is suspended{owner.review_note ? `: ${owner.review_note}` : '.'} Contact support for help.
          </p>
        ) : (
          owner?.status !== 'pending' && <OwnerApplication owner={owner} defaultPhone={profile?.phone ?? ''} defaultName={profile?.full_name ?? ''} />
        )}
      </div>
    )
  }

  const [{ data: vehicles }, { data: bookings }] = await Promise.all([
    supabase
      .from('rental_vehicles')
      .select('id, title, photos, status, daily_rate, currency, city, review_note, rating_avg, rating_count')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .returns<Pick<RentalVehicle, 'id' | 'title' | 'photos' | 'status' | 'daily_rate' | 'currency' | 'city' | 'review_note' | 'rating_avg' | 'rating_count'>[]>(),
    supabase
      .from('rental_bookings')
      .select('id, reference, vehicle_id, status, start_at, end_at, total_amount, owner_earnings, currency')
      .eq('owner_id', user.id)
      .order('start_at', { ascending: true })
      .limit(100)
      .returns<Booking[]>(),
  ])
  const titles = new Map((vehicles ?? []).map((v) => [v.id, v.title]))
  const open = (bookings ?? []).filter((b) => ['requested', 'confirmed', 'active'].includes(b.status))
  const completed = (bookings ?? []).filter((b) => b.status === 'completed')
  const currency = vehicles?.[0]?.currency ?? country?.currency_code ?? 'GHS'
  const earnings = completed.reduce((s, b) => s + Number(b.owner_earnings ?? 0), 0)

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Rental partner</p>
          <h1 className="font-heading text-3xl font-bold tracking-tight">{owner.business_name}</h1>
        </div>
        <Link href="/partner/rentals/new" className={cn(buttonVariants(), 'h-11 px-4')}>
          <Plus data-icon="inline-start" aria-hidden="true" /> Add listing
        </Link>
      </header>

      <dl className="grid gap-3 sm:grid-cols-4">
        {[
          ['Listings', String(vehicles?.length ?? 0)],
          ['Awaiting response', String(open.filter((b) => b.status === 'requested').length)],
          ['Upcoming & active', String(open.filter((b) => b.status !== 'requested').length)],
          ['Earnings (completed)', formatMoney(earnings, currency, locale)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border bg-card p-4">
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="mt-1 font-heading text-xl font-bold">{v}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="bookings-h" className="flex flex-col gap-3">
        <h2 id="bookings-h" className="font-heading text-lg font-semibold">Bookings to manage</h2>
        {open.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">No open bookings right now.</p>
        ) : (
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
            {open.map((b) => (
              <li key={b.id}>
                <Link href={`/account/rentals/${b.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{titles.get(b.vehicle_id)}</p>
                    <p className="text-sm text-muted-foreground">{b.reference} · {formatRange(b.start_at, b.end_at, locale)}</p>
                  </div>
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold capitalize', RENTAL_STATUS_STYLES[b.status])}>
                    {b.status === 'requested' ? 'Needs response' : b.status}
                  </span>
                  <span className="text-sm font-medium">{formatMoney(Number(b.total_amount), b.currency, locale)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="listings-h" className="flex flex-col gap-3">
        <h2 id="listings-h" className="font-heading text-lg font-semibold">Your listings</h2>
        {(vehicles ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            You have no listings yet. <Link href="/partner/rentals/new" className="font-medium text-primary hover:underline">Add your first vehicle</Link>
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles!.map((v) => (
              <li key={v.id} className="overflow-hidden rounded-2xl border bg-card">
                <Link href={`/partner/rentals/${v.id}`} className="flex flex-col hover:bg-muted/30">
                  <div className="relative aspect-[16/9] bg-muted">
                    {v.photos[0] && <Image src={v.photos[0]} alt={v.title} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover" />}
                  </div>
                  <div className="flex flex-col gap-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{v.title}</p>
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold capitalize', LISTING_STATUS_STYLES[v.status])}>{v.status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{v.city} · {formatMoney(Number(v.daily_rate), v.currency, locale)}/day</p>
                    {v.status === 'rejected' && v.review_note && <p className="text-xs text-destructive">{v.review_note}</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
