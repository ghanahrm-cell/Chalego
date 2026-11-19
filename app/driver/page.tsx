import type { Metadata } from 'next'
import { Clock, ShieldAlert, XCircle } from 'lucide-react'
import { DriverApplication } from '@/components/driver/driver-application'
import { DriverDashboard } from '@/components/driver/driver-dashboard'
import { requireUser } from '@/lib/session'
import type { RideStatus } from '@/lib/rides'

export const metadata: Metadata = { title: 'Drive with CHALEGO', robots: { index: false } }

type Driver = {
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  review_note: string | null
  is_online: boolean
  license_number: string
  vehicle_make: string
  vehicle_model: string
  vehicle_year: number
  vehicle_color: string
  plate_number: string
  category_code: string
}

export default async function DriverPage() {
  const { supabase, user, country } = await requireUser('/driver')
  const locale = country?.locale ?? 'en-GH'
  const currency = country?.currency_code ?? 'GHS'

  const [{ data: driver }, { data: categories }] = await Promise.all([
    supabase
      .from('drivers')
      .select('status, review_note, is_online, license_number, vehicle_make, vehicle_model, vehicle_year, vehicle_color, plate_number, category_code')
      .eq('id', user.id)
      .maybeSingle<Driver>(),
    supabase.from('ride_categories').select('code, name, seats').eq('is_active', true).order('sort_order'),
  ])

  const categoryName = categories?.find((c) => c.code === driver?.category_code)?.name ?? 'ride'

  let body: React.ReactNode
  if (!driver || driver.status === 'rejected') {
    body = (
      <div className="flex flex-col gap-6">
        {driver?.status === 'rejected' && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
            <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>Your previous application was not approved{driver.review_note ? `: ${driver.review_note}` : '.'} Update your details and resubmit.</span>
          </p>
        )}
        <DriverApplication categories={categories ?? []} existing={driver ?? null} />
      </div>
    )
  } else if (driver.status === 'pending') {
    body = (
      <div className="flex flex-col gap-6">
        <div role="status" className="flex items-start gap-3 rounded-xl border border-accent/50 bg-accent/10 p-4">
          <Clock className="mt-0.5 size-5 shrink-0 text-accent-foreground" aria-hidden="true" />
          <div>
            <p className="font-medium">Application under review</p>
            <p className="text-sm text-muted-foreground">
              We are verifying your {driver.vehicle_color} {driver.vehicle_make} {driver.vehicle_model} ({driver.plate_number}). You can
              edit details below while you wait.
            </p>
          </div>
        </div>
        <DriverApplication categories={categories ?? []} existing={driver} />
      </div>
    )
  } else if (driver.status === 'suspended') {
    body = (
      <p role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>Your driver account is suspended{driver.review_note ? `: ${driver.review_note}` : '.'} Contact support for help.</span>
      </p>
    )
  } else {
    const since = new Date(Date.now() - 7 * 86400_000).toISOString()
    const [{ data: active }, { data: done }] = await Promise.all([
      supabase
        .from('rides')
        .select('id, status, pickup_address, dropoff_address, scheduled_for')
        .eq('driver_id', user.id)
        .in('status', ['accepted', 'arriving', 'in_progress'])
        .order('scheduled_for', { ascending: true, nullsFirst: true })
        .returns<{ id: string; status: RideStatus; pickup_address: string; dropoff_address: string; scheduled_for: string | null }[]>(),
      supabase
        .from('rides')
        .select('driver_earnings, completed_at')
        .eq('driver_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', since),
    ])
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const rows = done ?? []
    const earnings = {
      today: rows.filter((r) => new Date(r.completed_at!) >= startOfDay).reduce((s, r) => s + Number(r.driver_earnings ?? 0), 0),
      week: rows.reduce((s, r) => s + Number(r.driver_earnings ?? 0), 0),
      trips: rows.length,
    }
    body = (
      <DriverDashboard
        initialOnline={driver.is_online}
        categoryName={categoryName}
        locale={locale}
        currency={currency}
        activeTrips={active ?? []}
        earnings={earnings}
      />
    )
  }

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 lg:py-12">
      <header className="mb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {driver?.status === 'approved' ? 'Driver dashboard' : 'Drive with CHALEGO'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {driver?.status === 'approved'
            ? `${driver.vehicle_color} ${driver.vehicle_make} ${driver.vehicle_model} · ${driver.plate_number}`
            : `Earn on your schedule across ${country?.name ?? 'Ghana'}. Tell us about you and your vehicle.`}
        </p>
      </header>
      {body}
    </main>
  )
}
