import type { Metadata } from 'next'
import Link from 'next/link'
import { PackageSearch } from 'lucide-react'
import { ShipmentBooker } from '@/components/shipments/shipment-booker'
import { getBookingContext } from '@/lib/booking-data'

export const metadata: Metadata = { title: 'Send a package', robots: { index: false } }

export default async function SendPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const sp = await searchParams
  const kind = sp.kind === 'cargo' ? 'cargo' : 'moto'
  const { countryCode, countryName, locale, methods, profile, country } = await getBookingContext(`/send?kind=${kind}`)

  return (
    <main id="main" className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:py-10">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">Send anything</h1>
          <p className="mt-1 text-muted-foreground">Parcels by motorbike, cargo by van or truck, across {countryName}.</p>
        </div>
        <Link href="/track" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          <PackageSearch className="size-4" aria-hidden="true" /> Track a delivery
        </Link>
      </header>
      {methods.length === 0 && (
        <p role="alert" className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          No payment methods are enabled for {countryName} yet.
        </p>
      )}
      <ShipmentBooker
        key={kind}
        country={countryCode}
        locale={locale}
        currency={country?.currency_code ?? 'GHS'}
        methods={methods}
        initialKind={kind}
        sender={{ name: profile?.full_name ?? '', phone: profile?.phone ?? '' }}
      />
    </main>
  )
}
