import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { AutoRefresh } from '@/components/food/auto-refresh'
import { OwnerApplication } from '@/components/rentals/owner-application'
import { requireUser } from '@/lib/session'
import { formatMoney, isAdminRole } from '@/lib/account'
import { FOOD_ACTIVE, FOOD_STATUS_LABELS, FOOD_STATUS_STYLES, type FoodStatus } from '@/lib/food'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Restaurant dashboard', robots: { index: false } }

type Rest = { id: string; name: string; city: string; cover_url: string | null; is_open: boolean; is_active: boolean; currency: string; rating_avg: number | null; rating_count: number }
type Applicant = {
  owner_type: 'individual' | 'fleet'
  business_name: string
  registration_number: string | null
  phone: string
  city: string
  payout_details: string | null
  status: string
  review_note: string | null
}
type Order = { id: string; reference: string; restaurant_id: string; status: FoodStatus; fulfilment: string; total_amount: number; restaurant_earnings: number | null; currency: string; created_at: string }

export default async function PartnerFoodPage() {
  const { supabase, user, profile, country } = await requireUser('/partner/food')
  const locale = country?.locale ?? 'en-GH'
  const isAdmin = isAdminRole(profile?.role)
  const { data: owner } = await supabase
    .from('rental_owners')
    .select('owner_type, business_name, registration_number, phone, city, payout_details, status, review_note')
    .eq('id', user.id)
    .maybeSingle<Applicant>()
  const approved = owner?.status === 'approved'

  if (!approved && !isAdmin) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <header>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Partner your restaurant with CHALEGO</h1>
          <p className="mt-1 text-muted-foreground">
            Put your menu online, accept delivery and pickup orders, and let CHALEGO riders handle the last mile. Once approved, you can add your restaurant, menu and opening hours.
          </p>
        </header>
        {owner?.status === 'pending' && (
          <p role="status" className="rounded-lg bg-accent/15 px-4 py-3 text-sm">Your restaurant application is under review. We usually respond within 2 business days.</p>
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
          owner?.status !== 'pending' && (
            <OwnerApplication variant="food" owner={owner} defaultPhone={profile?.phone ?? ''} defaultName={profile?.full_name ?? ''} />
          )
        )}
        <p className="text-xs text-muted-foreground">
          One verified partner account covers restaurants, stays and vehicle rentals, so you only need to apply once.
        </p>
      </div>
    )
  }

  const restQuery = supabase.from('restaurants').select('id, name, city, cover_url, is_open, is_active, currency, rating_avg, rating_count').order('created_at', { ascending: false })
  const orderQuery = supabase
    .from('food_orders')
    .select('id, reference, restaurant_id, status, fulfilment, total_amount, restaurant_earnings, currency, created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  const [{ data: rests }, { data: orders }] = await Promise.all([
    (approved ? restQuery.eq('owner_id', user.id) : restQuery.is('owner_id', null)).returns<Rest[]>(),
    (approved ? orderQuery.eq('owner_id', user.id) : orderQuery.is('owner_id', null)).returns<Order[]>(),
  ])

  const names = new Map((rests ?? []).map((r) => [r.id, r.name]))
  const live = (orders ?? []).filter((o) => FOOD_ACTIVE.includes(o.status))
  const done = (orders ?? []).filter((o) => o.status === 'completed')
  const currency = rests?.[0]?.currency ?? country?.currency_code ?? 'GHS'
  const earnings = done.reduce((s, o) => s + Number(o.restaurant_earnings ?? 0), 0)
  const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col gap-8">
      <AutoRefresh seconds={20} />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Restaurant dashboard</p>
          <h1 className="font-heading text-3xl font-bold tracking-tight">{approved ? owner.business_name : 'CHALEGO Kitchen'}</h1>
        </div>
        <Link href="/partner/food/new" className={cn(buttonVariants(), 'h-11 px-4')}>
          <Plus data-icon="inline-start" aria-hidden="true" /> Add restaurant
        </Link>
      </header>

      <dl className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'New orders', value: String(live.filter((o) => o.status === 'placed').length) },
          { label: 'In progress', value: String(live.filter((o) => o.status !== 'placed').length) },
          { label: 'Earnings (recent completed)', value: formatMoney(earnings, currency, locale) },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5">
            <dt className="text-sm text-muted-foreground">{s.label}</dt>
            <dd className="mt-1 font-heading text-2xl font-bold">{s.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="live">
        <h2 id="live" className="mb-3 font-heading text-xl font-semibold">Live orders</h2>
        {live.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">No open orders. New orders appear here automatically.</p>
        ) : (
          <OrderList orders={live} names={names} date={date} locale={locale} />
        )}
      </section>

      <section aria-labelledby="rests">
        <h2 id="rests" className="mb-3 font-heading text-xl font-semibold">Your restaurants</h2>
        {(rests ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No restaurants yet. <Link href="/partner/food/new" className="font-medium text-primary hover:underline">Add your first restaurant</Link>
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rests!.map((r) => (
              <li key={r.id}>
                <Link href={`/partner/food/${r.id}`} className="flex items-center gap-3 rounded-2xl border bg-card p-3 hover:border-primary">
                  <Image src={r.cover_url || '/images/food-jollof.png'} alt="" width={64} height={64} className="size-16 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.name}</p>
                    <p className="text-sm text-muted-foreground">{r.city}</p>
                    <p className={cn('text-xs font-semibold', !r.is_active ? 'text-muted-foreground' : r.is_open ? 'text-primary' : 'text-destructive')}>
                      {!r.is_active ? 'Hidden' : r.is_open ? 'Open for orders' : 'Closed'}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section aria-labelledby="past">
          <h2 id="past" className="mb-3 font-heading text-xl font-semibold">Recent completed</h2>
          <OrderList orders={done.slice(0, 15)} names={names} date={date} locale={locale} />
        </section>
      )}
    </div>
  )
}

function OrderList({ orders, names, date, locale }: { orders: Order[]; names: Map<string, string>; date: Intl.DateTimeFormat; locale: string }) {
  return (
    <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/account/food/${o.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{o.reference} · {names.get(o.restaurant_id) ?? 'Restaurant'}</p>
              <p className="text-sm text-muted-foreground">{date.format(new Date(o.created_at))} · <span className="capitalize">{o.fulfilment}</span></p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', FOOD_STATUS_STYLES[o.status])}>{FOOD_STATUS_LABELS[o.status]}</span>
              <span className="text-sm">{formatMoney(Number(o.total_amount), o.currency, locale)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
