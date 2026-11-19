import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { requireUser } from '@/lib/session'
import { formatMoney, isAdminRole } from '@/lib/account'
import { formatStayDates, STAY_STATUS_LABELS, STAY_STATUS_STYLES, type StayStatus } from '@/lib/stays'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Host dashboard', robots: { index: false } }

type Prop = { id: string; title: string; kind: string; city: string; photos: string[]; is_active: boolean; currency: string; rating_avg: number | null; rating_count: number }
type Booking = { id: string; reference: string; property_id: string; status: StayStatus; check_in: string; check_out: string; total_amount: number; owner_earnings: number | null; currency: string }

export default async function PartnerStaysPage() {
  const { supabase, user, profile, country } = await requireUser('/partner/stays')
  const locale = country?.locale ?? 'en-GH'
  const isAdmin = isAdminRole(profile?.role)
  const { data: owner } = await supabase
    .from('rental_owners')
    .select('business_name, status')
    .eq('id', user.id)
    .maybeSingle<{ business_name: string; status: string }>()

  if (owner?.status !== 'approved' && !isAdmin) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Host your property on CHALEGO</h1>
        <p className="text-muted-foreground">
          List hotel rooms or furnished apartments, set nightly rates and discounts, and confirm each booking yourself. Hosts use the same verified partner account as vehicle owners.
        </p>
        {owner?.status === 'pending' ? (
          <p role="status" className="rounded-lg bg-accent/15 px-4 py-3 text-sm">Your partner application is under review. We usually respond within 2 business days.</p>
        ) : (
          <Link href="/partner/rentals" className={cn(buttonVariants(), 'h-11 w-fit px-5')}>
            {owner ? 'Review your partner application' : 'Apply to become a partner'}
          </Link>
        )}
      </div>
    )
  }

  const propsQuery = supabase
    .from('stay_properties')
    .select('id, title, kind, city, photos, is_active, currency, rating_avg, rating_count')
    .order('created_at', { ascending: false })
  const bookingsQuery = supabase
    .from('stay_bookings')
    .select('id, reference, property_id, status, check_in, check_out, total_amount, owner_earnings, currency')
    .order('check_in', { ascending: true })
    .limit(100)
  const [{ data: props }, { data: bookings }] = await Promise.all([
    (owner?.status === 'approved' ? propsQuery.eq('owner_id', user.id) : propsQuery.is('owner_id', null)).returns<Prop[]>(),
    (owner?.status === 'approved' ? bookingsQuery.eq('owner_id', user.id) : bookingsQuery.is('owner_id', null)).returns<Booking[]>(),
  ])

  const titles = new Map((props ?? []).map((p) => [p.id, p.title]))
  const open = (bookings ?? []).filter((b) => ['requested', 'confirmed', 'checked_in'].includes(b.status))
  const completed = (bookings ?? []).filter((b) => b.status === 'completed')
  const currency = props?.[0]?.currency ?? country?.currency_code ?? 'GHS'
  const earnings = completed.reduce((s, b) => s + Number(b.owner_earnings ?? 0), 0)

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Host dashboard</p>
          <h1 className="font-heading text-3xl font-bold tracking-tight">{owner?.status === 'approved' ? owner.business_name : 'CHALEGO Stays'}</h1>
        </div>
        <Link href="/partner/stays/new" className={cn(buttonVariants(), 'h-11 px-4')}>
          <Plus data-icon="inline-start" aria-hidden="true" /> Add property
        </Link>
      </header>

      <dl className="grid gap-3 sm:grid-cols-4">
        {[
          ['Properties', String(props?.length ?? 0)],
          ['Awaiting response', String(open.filter((b) => b.status === 'requested').length)],
          ['Upcoming & in-house', String(open.filter((b) => b.status !== 'requested').length)],
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
                <Link href={`/account/stays/${b.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{titles.get(b.property_id)}</p>
                    <p className="text-sm text-muted-foreground">{b.reference} · {formatStayDates(b.check_in, b.check_out, locale)}</p>
                  </div>
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', STAY_STATUS_STYLES[b.status])}>
                    {b.status === 'requested' ? 'Needs response' : STAY_STATUS_LABELS[b.status]}
                  </span>
                  <span className="text-sm font-medium">{formatMoney(Number(b.total_amount), b.currency, locale)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="props-h" className="flex flex-col gap-3">
        <h2 id="props-h" className="font-heading text-lg font-semibold">Your properties</h2>
        {(props ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No properties yet. <Link href="/partner/stays/new" className="font-medium text-primary hover:underline">Add your first property</Link>
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {props!.map((p) => (
              <li key={p.id} className="overflow-hidden rounded-2xl border bg-card">
                <Link href={`/partner/stays/${p.id}`} className="flex flex-col hover:bg-muted/30">
                  <div className="relative aspect-[16/9] bg-muted">
                    {p.photos[0] && <Image src={p.photos[0]} alt={p.title} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover" />}
                  </div>
                  <div className="flex flex-col gap-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{p.title}</p>
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', p.is_active ? 'bg-primary/10 text-primary' : 'bg-muted')}>
                        {p.is_active ? 'Live' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-sm capitalize text-muted-foreground">{p.kind} · {p.city}</p>
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
