import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { requireAdmin } from '@/lib/session'
import { fieldClass, formatMoney } from '@/lib/account'
import { reviewRentalOwner, reviewRentalVehicle, resolveRentalDamage } from '@/app/admin/rental-actions'
import { formatRange, LISTING_STATUS_STYLES, RENTAL_STATUS_STYLES, type RentalStatus, type RentalVehicle } from '@/lib/rentals'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Rentals · Admin' }

type Owner = { id: string; country_code: string; owner_type: string; business_name: string; registration_number: string | null; phone: string; city: string; status: string; created_at: string }
type Vehicle = Pick<RentalVehicle, 'id' | 'owner_id' | 'title' | 'kind' | 'city' | 'country_code' | 'daily_rate' | 'currency' | 'status'>
type Booking = { id: string; reference: string; vehicle_id: string; status: RentalStatus; start_at: string; end_at: string; total_amount: number; currency: string; country_code: string }
type Damage = { id: string; booking_id: string; severity: string; description: string; reporter_role: string; created_at: string }

const btn = 'h-9 rounded-lg px-3 text-xs font-semibold'

export default async function AdminRentalsPage() {
  const { supabase } = await requireAdmin()
  const [{ data: owners }, { data: vehicles }, { data: bookings }, { data: damages }] = await Promise.all([
    supabase.from('rental_owners').select('id, country_code, owner_type, business_name, registration_number, phone, city, status, created_at').in('status', ['pending', 'approved', 'suspended']).order('created_at', { ascending: false }).limit(100).returns<Owner[]>(),
    supabase.from('rental_vehicles').select('id, owner_id, title, kind, city, country_code, daily_rate, currency, status').order('created_at', { ascending: false }).limit(200).returns<Vehicle[]>(),
    supabase.from('rental_bookings').select('id, reference, vehicle_id, status, start_at, end_at, total_amount, currency, country_code').order('created_at', { ascending: false }).limit(30).returns<Booking[]>(),
    supabase.from('rental_damage_reports').select('id, booking_id, severity, description, reporter_role, created_at').eq('status', 'open').order('created_at', { ascending: false }).returns<Damage[]>(),
  ])
  const pendingOwners = (owners ?? []).filter((o) => o.status === 'pending')
  const pendingVehicles = (vehicles ?? []).filter((v) => v.status === 'pending')
  const fleet = (vehicles ?? []).filter((v) => v.owner_id === null)
  const titles = new Map((vehicles ?? []).map((v) => [v.id, v.title]))
  const loc = (c: string) => (c === 'NG' ? 'en-NG' : c === 'CI' ? 'fr-CI' : 'en-GH')

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Rentals</h1>
          <p className="text-sm text-muted-foreground">Partners, listings, bookings and damage reports.</p>
        </div>
        <Link href="/partner/rentals/new?platform=1" className={cn(buttonVariants(), 'h-10 px-4')}>
          <Plus data-icon="inline-start" aria-hidden="true" /> Add fleet vehicle
        </Link>
      </header>

      <Section title={`Partner applications (${pendingOwners.length})`}>
        {pendingOwners.length === 0 ? <Empty text="No pending applications." /> : (
          <ul className="divide-y">
            {pendingOwners.map((o) => (
              <li key={o.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                <div className="flex-1 text-sm">
                  <p className="font-medium">{o.business_name} <span className="text-muted-foreground">· {o.owner_type === 'fleet' ? 'Fleet company' : 'Individual'} · {o.country_code}</span></p>
                  <p className="text-muted-foreground">{o.city} · {o.phone}{o.registration_number ? ` · Reg ${o.registration_number}` : ''}</p>
                </div>
                <ReviewForm action={reviewRentalOwner} id={o.id} approve="approved" reject="rejected" />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Listings awaiting review (${pendingVehicles.length})`}>
        {pendingVehicles.length === 0 ? <Empty text="No listings waiting." /> : (
          <ul className="divide-y">
            {pendingVehicles.map((v) => (
              <li key={v.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                <div className="flex-1 text-sm">
                  <Link href={`/rentals/${v.id}`} className="font-medium hover:underline">{v.title}</Link>
                  <p className="text-muted-foreground">{v.kind} · {v.city}, {v.country_code} · {formatMoney(Number(v.daily_rate), v.currency, loc(v.country_code))}/day</p>
                </div>
                <ReviewForm action={reviewRentalVehicle} id={v.id} approve="active" reject="rejected" />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Open damage reports (${(damages ?? []).length})`}>
        {(damages ?? []).length === 0 ? <Empty text="No open reports." /> : (
          <ul className="divide-y">
            {damages!.map((d) => (
              <li key={d.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
                <div className="flex-1 text-sm">
                  <p className="font-medium capitalize">{d.severity} · reported by {d.reporter_role}</p>
                  <p className="line-clamp-2 text-muted-foreground">{d.description}</p>
                </div>
                <Link href={`/account/rentals/${d.booking_id}`} className="text-sm font-medium text-primary hover:underline">View booking</Link>
                <form action={resolveRentalDamage}>
                  <input type="hidden" name="id" value={d.id} />
                  <button className={cn(btn, 'border hover:bg-muted')}>Mark resolved</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`CHALEGO Fleet (${fleet.length})`}>
        <ul className="divide-y">
          {fleet.map((v) => (
            <li key={v.id} className="flex items-center gap-3 p-4 text-sm">
              <Link href={`/partner/rentals/${v.id}`} className="flex-1 font-medium hover:underline">{v.title}</Link>
              <span className="hidden text-muted-foreground sm:inline">{v.city}, {v.country_code}</span>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold capitalize', LISTING_STATUS_STYLES[v.status])}>{v.status}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Recent bookings">
        {(bookings ?? []).length === 0 ? <Empty text="No bookings yet." /> : (
          <ul className="divide-y">
            {bookings!.map((b) => (
              <li key={b.id}>
                <Link href={`/account/rentals/${b.id}`} className="flex flex-wrap items-center gap-3 p-4 text-sm hover:bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{titles.get(b.vehicle_id) ?? 'Rental'}</p>
                    <p className="text-muted-foreground">{b.reference} · {formatRange(b.start_at, b.end_at, loc(b.country_code))}</p>
                  </div>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold capitalize', RENTAL_STATUS_STYLES[b.status])}>{b.status}</span>
                  <span className="font-medium">{formatMoney(Number(b.total_amount), b.currency, loc(b.country_code))}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <h2 className="border-b px-4 py-3 font-heading text-base font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="p-4 text-sm text-muted-foreground">{text}</p>
}

function ReviewForm({ action, id, approve, reject }: { action: (f: FormData) => Promise<void>; id: string; approve: string; reject: string }) {
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <label className="sr-only" htmlFor={`note-${id}`}>Review note</label>
      <input id={`note-${id}`} name="note" maxLength={300} placeholder="Note (optional)" className={cn(fieldClass, 'h-9 w-48')} />
      <button name="status" value={approve} className={cn(btn, 'bg-primary text-primary-foreground hover:bg-primary/90')}>Approve</button>
      <button name="status" value={reject} className={cn(btn, 'border border-destructive/40 text-destructive hover:bg-destructive/10')}>Reject</button>
    </form>
  )
}
