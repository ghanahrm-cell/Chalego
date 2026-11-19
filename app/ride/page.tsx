import type { Metadata } from 'next'
import Link from 'next/link'
import { Plane } from 'lucide-react'
import { RideBooker } from '@/components/rides/ride-booker'
import { getBookingContext } from '@/lib/booking-data'

export const metadata: Metadata = { title: 'Book a ride', robots: { index: false } }

export default async function RidePage() {
  const { countryCode, countryName, locale, methods } = await getBookingContext('/ride')

  return (
    <main id="main" className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:py-10">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">Where to?</h1>
          <p className="mt-1 text-muted-foreground">Upfront prices for rides across {countryName}.</p>
        </div>
        <Link href="/airport" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          <Plane className="size-4" aria-hidden="true" /> Going to or from the airport?
        </Link>
      </header>
      {methods.length === 0 && (
        <p role="alert" className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          No payment methods are enabled for {countryName} yet.
        </p>
      )}
      <RideBooker country={countryCode} locale={locale} methods={methods} savedPlaces={[]} />
    </main>
  )
}
