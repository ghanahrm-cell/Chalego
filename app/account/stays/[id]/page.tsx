import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Clock, MapPin } from 'lucide-react'
import { PayByCardPanel } from '@/components/payments/pay-by-card-panel'
import { StayActions } from '@/components/stays/stay-actions'
import { requireUser } from '@/lib/session'
import { formatMoney, isAdminRole } from '@/lib/account'
import {
  formatStayDates,
  nightsLabel,
  STAY_BOOKING_SELECT,
  STAY_COUNTRIES,
  STAY_STATUS_LABELS,
  STAY_STATUS_STYLES,
  type StayBooking,
} from '@/lib/stays'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Stay booking', robots: { index: false } }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const NEXT_STEP: Record<string, string> = {
  requested: 'Waiting for the host to confirm. You are not charged until they do.',
  confirmed: 'Your stay is confirmed. Show your booking reference and photo ID at check-in.',
  checked_in: 'Enjoy your stay. The host checks you out at the end.',
  completed: 'Thanks for staying with CHALEGO.',
  cancelled: 'This booking was cancelled.',
  rejected: 'The host could not accept this request. Try other dates or another property.',
}

export default async function StayBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()
  const { supabase, user, profile } = await requireUser(`/account/stays/${id}`)
  const { data: b } = await supabase.from('stay_bookings').select(STAY_BOOKING_SELECT).eq('id', id).maybeSingle<StayBooking>()
  if (!b) notFound()

  const [{ data: prop }, { data: unit }, { data: guest }] = await Promise.all([
    supabase.from('stay_properties').select('id, title, address, city, check_in_time, check_out_time').eq('id', b.property_id)
      .maybeSingle<{ id: string; title: string; address: string; city: string; check_in_time: string; check_out_time: string }>(),
    supabase.from('stay_units').select('name').eq('id', b.unit_id).maybeSingle<{ name: string }>(),
    b.guest_id !== user.id
      ? supabase.from('profiles').select('full_name, phone').eq('id', b.guest_id).maybeSingle<{ full_name: string | null; phone: string | null }>()
      : Promise.resolve({ data: null }),
  ])

  const viewer = b.guest_id === user.id ? 'guest' : b.owner_id === user.id ? 'owner' : isAdminRole(profile?.role) ? 'admin' : 'owner'
  const locale = STAY_COUNTRIES[b.country_code]?.locale ?? 'en-GH'
  const money = (n: number | null) => formatMoney(Number(n ?? 0), b.currency, locale)
  const today = new Date().toISOString().slice(0, 10)

  const lines: [string, string][] = [
    [`${money(b.nightly_rate)} × ${nightsLabel(b.nights)}`, money(b.subtotal)],
    ...(Number(b.discount_amount) > 0 ? ([['Discount', `−${money(b.discount_amount)}`]] as [string, string][]) : []),
    ...(Number(b.cleaning_fee) > 0 ? ([['Cleaning fee', money(b.cleaning_fee)]] as [string, string][]) : []),
    ...(Number(b.tax_amount) > 0 ? ([['Tax', money(b.tax_amount)]] as [string, string][]) : []),
  ]

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link href={viewer === 'guest' ? '/account/stays' : '/partner/stays'} className="hover:text-foreground">
          {viewer === 'guest' ? 'My stays' : 'Host dashboard'}
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-foreground">{b.reference}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {prop ? <Link href={`/stays/${prop.id}`} className="hover:underline">{prop.title}</Link> : 'Stay'}
          </h1>
          <p className="text-sm text-muted-foreground">{unit?.name} · {b.guests} guest{b.guests === 1 ? '' : 's'} · {b.reference}</p>
        </div>
        <span className={cn('rounded-full px-3 py-1 text-sm font-semibold', STAY_STATUS_STYLES[b.status])}>{STAY_STATUS_LABELS[b.status]}</span>
      </header>

      <p role="status" className="rounded-lg bg-muted px-4 py-3 text-sm">
        {viewer === 'guest' ? NEXT_STEP[b.status] : b.status === 'requested' ? 'New request. Confirm or decline it below.' : NEXT_STEP[b.status]}
        {b.cancel_reason ? ` Reason: ${b.cancel_reason}` : ''}
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="dates-h" className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
            <h2 id="dates-h" className="font-heading text-base font-semibold">Your stay</h2>
            <p className="font-medium">{formatStayDates(b.check_in, b.check_out, locale)} · {nightsLabel(b.nights)}</p>
            {prop && (
              <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><MapPin className="size-4" aria-hidden="true" />{prop.address}, {prop.city}</li>
                <li className="flex items-center gap-2"><Clock className="size-4" aria-hidden="true" />Check-in from {prop.check_in_time} · check-out by {prop.check_out_time}</li>
              </ul>
            )}
            {guest && (
              <p className="text-sm">Guest: <strong>{guest.full_name ?? 'CHALEGO user'}</strong>{guest.phone ? ` · ${guest.phone}` : ''}</p>
            )}
            {b.guest_note && <p className="rounded-lg bg-muted px-3 py-2 text-sm"><span className="font-semibold">Guest note:</span> {b.guest_note}</p>}
            {b.owner_note && <p className="rounded-lg bg-muted px-3 py-2 text-sm"><span className="font-semibold">Host note:</span> {b.owner_note}</p>}
          </section>

          <section aria-labelledby="price-h" className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
            <h2 id="price-h" className="font-heading text-base font-semibold">Price details</h2>
            <dl className="flex flex-col gap-1.5 text-sm">
              {lines.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></div>
              ))}
              <div className="flex justify-between gap-3 border-t pt-1.5 font-heading text-base font-semibold"><dt>Total</dt><dd>{money(b.total_amount)}</dd></div>
              <div className="flex justify-between gap-3 text-muted-foreground"><dt>Payment</dt><dd className="capitalize">{b.payment_method.replace(/_/g, ' ')}</dd></div>
              {viewer !== 'guest' && b.owner_earnings != null && (
                <>
                  <div className="flex justify-between gap-3 text-muted-foreground"><dt>CHALEGO commission</dt><dd>−{money(b.commission_amount)}</dd></div>
                  <div className="flex justify-between gap-3 font-semibold"><dt>Your earnings</dt><dd>{money(b.owner_earnings)}</dd></div>
                </>
              )}
            </dl>
          </section>

          {b.rating != null && (
            <section className="flex flex-col gap-1 rounded-2xl border bg-card p-5">
              <h2 className="font-heading text-base font-semibold">Guest review</h2>
              <p className="text-sm">{b.rating} / 5{b.review ? ` · ${b.review}` : ''}</p>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          {viewer === 'guest' && <PayByCardPanel kind="stay" id={b.id} userId={user.id} locale={locale} />}
          <StayActions id={b.id} status={b.status} viewer={viewer} checkIn={b.check_in} checkOut={b.check_out} today={today} rated={b.rating != null} />
        </aside>
      </div>
    </div>
  )
}
