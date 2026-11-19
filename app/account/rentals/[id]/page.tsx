import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Phone } from 'lucide-react'
import { BookingActions } from '@/components/rentals/booking-actions'
import { requireUser } from '@/lib/session'
import { formatMoney } from '@/lib/account'
import { capitalize, formatRange, RENTAL_STATUS_STYLES, type RentalStatus } from '@/lib/rentals'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Rental booking', robots: { index: false } }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const LOCALES: Record<string, string> = { GH: 'en-GH', NG: 'en-NG', CI: 'fr-CI' }

type Details = {
  id: string
  reference: string
  viewer: 'renter' | 'owner' | 'admin'
  status: RentalStatus
  country_code: string
  currency: string
  start_at: string
  end_at: string
  drive_option: string
  delivery: boolean
  delivery_address: string | null
  billing_label: string
  base_amount: number
  driver_fee: number
  delivery_fee: number
  tax_amount: number
  total_amount: number
  deposit_amount: number
  commission_amount?: number | null
  owner_earnings?: number | null
  deposit_refund: number | null
  payment_method: string
  id_type: string
  id_number: string
  license_number: string | null
  agreement_name: string
  agreement_accepted_at: string
  renter_note: string | null
  owner_note: string | null
  pickup_odometer: number | null
  pickup_fuel: string | null
  pickup_notes: string | null
  picked_up_at: string | null
  return_odometer: number | null
  return_fuel: string | null
  return_notes: string | null
  returned_at: string | null
  cancel_reason: string | null
  cancelled_by: string | null
  rating: number | null
  review: string | null
  vehicle: { id: string; title: string; photos: string[]; pickup_address: string; city: string }
  renter: { name: string; phone: string | null }
  owner: { name: string; phone: string | null }
}

type Damage = { id: string; reporter_role: string; stage: string; severity: string; description: string; estimated_cost: number | null; photos: string[]; status: string; created_at: string }

export default async function RentalBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()
  const { supabase, user } = await requireUser(`/account/rentals/${id}`)
  const [{ data }, { data: damages }] = await Promise.all([
    supabase.rpc('rental_booking_details', { p_id: id }),
    supabase
      .from('rental_damage_reports')
      .select('id, reporter_role, stage, severity, description, estimated_cost, photos, status, created_at')
      .eq('booking_id', id)
      .order('created_at', { ascending: false })
      .returns<Damage[]>(),
  ])
  const b = data as Details | null
  if (!b) notFound()
  const locale = LOCALES[b.country_code] ?? 'en-GH'
  const money = (n: number | null | undefined) => formatMoney(Number(n ?? 0), b.currency, locale)
  const counterpart = b.viewer === 'renter' ? { label: 'Owner', ...b.owner } : { label: 'Renter', ...b.renter }
  const backHref = b.viewer === 'renter' ? '/account/rentals' : b.viewer === 'admin' ? '/admin/rentals' : '/partner/rentals'

  return (
    <div className="flex flex-col gap-6">
      <Link href={backHref} className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to {b.viewer === 'renter' ? 'my rentals' : b.viewer === 'admin' ? 'rentals admin' : 'partner dashboard'}
      </Link>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {b.vehicle?.photos?.[0] && (
          <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-40">
            <Image src={b.vehicle.photos[0]} alt={b.vehicle.title} fill sizes="160px" className="object-cover" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight">{b.vehicle?.title ?? 'Rental'}</h1>
            <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold capitalize', RENTAL_STATUS_STYLES[b.status])}>{b.status}</span>
          </div>
          <p className="text-sm text-muted-foreground">{b.reference} · {formatRange(b.start_at, b.end_at, locale)}</p>
          <p className="text-sm text-muted-foreground">
            {b.delivery ? `Delivery to ${b.delivery_address}` : `Pickup at ${b.vehicle?.pickup_address}`} · {b.drive_option === 'self_drive' ? 'Self-drive' : 'With driver'}
          </p>
        </div>
      </header>

      {b.status === 'requested' && b.viewer === 'renter' && (
        <p role="status" className="rounded-lg bg-accent/15 px-4 py-3 text-sm">Waiting for {b.owner.name} to confirm. You have not been charged.</p>
      )}
      {b.cancel_reason && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">Cancelled by {b.cancelled_by}: {b.cancel_reason}</p>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="mb-3 font-heading text-base font-semibold">Payment</h2>
            <dl className="flex flex-col gap-1.5 text-sm">
              <Row k={`Rental (${b.billing_label})`} v={money(b.base_amount)} />
              {Number(b.driver_fee) > 0 && <Row k="Driver" v={money(b.driver_fee)} />}
              {Number(b.delivery_fee) > 0 && <Row k="Delivery" v={money(b.delivery_fee)} />}
              {Number(b.tax_amount) > 0 && <Row k="Tax" v={money(b.tax_amount)} />}
              <Row k="Total" v={money(b.total_amount)} strong />
              {Number(b.deposit_amount) > 0 && <Row k="Security deposit" v={money(b.deposit_amount)} />}
              {b.deposit_refund != null && <Row k="Deposit refunded" v={money(b.deposit_refund)} />}
              <Row k="Method" v={capitalize(b.payment_method)} />
              {b.viewer !== 'renter' && b.owner_earnings != null && (
                <>
                  <Row k="Platform commission" v={`− ${money(b.commission_amount)}`} />
                  <Row k="Owner earnings" v={money(b.owner_earnings)} strong />
                </>
              )}
            </dl>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="mb-3 font-heading text-base font-semibold">Agreement and identity</h2>
            <dl className="flex flex-col gap-1.5 text-sm">
              <Row k="Signed by" v={b.agreement_name} />
              <Row k="Signed" v={new Date(b.agreement_accepted_at).toLocaleString(locale)} />
              <Row k={capitalize(b.id_type)} v={b.id_number} />
              {b.license_number && <Row k="Driving licence" v={b.license_number} />}
            </dl>
            {b.renter_note && <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm"><span className="font-semibold">Renter note:</span> {b.renter_note}</p>}
            {b.owner_note && <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm"><span className="font-semibold">Owner note:</span> {b.owner_note}</p>}
          </section>

          {(b.picked_up_at || b.returned_at) && (
            <section className="rounded-2xl border bg-card p-5">
              <h2 className="mb-3 font-heading text-base font-semibold">Inspection log</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {b.picked_up_at && (
                  <dl className="flex flex-col gap-1.5 text-sm">
                    <dt className="font-semibold">Pickup · {new Date(b.picked_up_at).toLocaleString(locale)}</dt>
                    <dd className="text-muted-foreground">Odometer {b.pickup_odometer?.toLocaleString()} km · Fuel {capitalize(b.pickup_fuel ?? '')}</dd>
                    {b.pickup_notes && <dd className="text-muted-foreground">{b.pickup_notes}</dd>}
                  </dl>
                )}
                {b.returned_at && (
                  <dl className="flex flex-col gap-1.5 text-sm">
                    <dt className="font-semibold">Return · {new Date(b.returned_at).toLocaleString(locale)}</dt>
                    <dd className="text-muted-foreground">Odometer {b.return_odometer?.toLocaleString()} km · Fuel {capitalize(b.return_fuel ?? '')}</dd>
                    {b.return_notes && <dd className="text-muted-foreground">{b.return_notes}</dd>}
                  </dl>
                )}
              </div>
            </section>
          )}

          {(damages ?? []).length > 0 && (
            <section className="rounded-2xl border bg-card p-5">
              <h2 className="mb-3 font-heading text-base font-semibold">Damage reports</h2>
              <ul className="flex flex-col gap-4">
                {damages!.map((d) => (
                  <li key={d.id} className="flex flex-col gap-2 border-b pb-4 last:border-0 last:pb-0">
                    <p className="text-sm">
                      <span className="font-semibold capitalize">{d.severity}</span> · found {d.stage === 'during' ? 'during rental' : `at ${d.stage}`} · by {d.reporter_role}
                      {d.status === 'resolved' && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">Resolved</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">{d.description}</p>
                    {d.estimated_cost != null && <p className="text-sm">Estimated cost: {money(d.estimated_cost)}</p>}
                    {d.photos.length > 0 && (
                      <ul className="flex flex-wrap gap-2">
                        {d.photos.map((p, i) => (
                          <li key={p} className="relative size-20 overflow-hidden rounded-lg bg-muted">
                            <a href={p} target="_blank" rel="noreferrer">
                              <Image src={p} alt={`Damage photo ${i + 1}`} fill sizes="80px" className="object-cover" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {b.rating != null && (
            <section className="rounded-2xl border bg-card p-5 text-sm">
              <h2 className="mb-2 font-heading text-base font-semibold">Renter rating</h2>
              <p>{b.rating} / 5{b.review ? ` · ${b.review}` : ''}</p>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{counterpart.label}</h2>
            <p className="mt-1 font-heading text-lg font-semibold">{counterpart.name}</p>
            {counterpart.phone ? (
              <a href={`tel:${counterpart.phone}`} className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <Phone className="size-4" aria-hidden="true" /> {counterpart.phone}
              </a>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Contact details are shared once the booking is confirmed.</p>
            )}
          </section>
          <BookingActions b={b} userId={user.id} locale={locale} />
        </aside>
      </div>
    </div>
  )
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={cn('flex justify-between gap-3', strong && 'border-t pt-1.5 font-semibold')}>
      <dt className={strong ? undefined : 'text-muted-foreground'}>{k}</dt>
      <dd className="text-right">{v}</dd>
    </div>
  )
}
