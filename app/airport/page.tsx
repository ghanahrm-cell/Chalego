import type { Metadata } from 'next'
import Link from 'next/link'
import { Car } from 'lucide-react'
import { AirportBooker } from '@/components/rides/airport-booker'
import { getBookingContext } from '@/lib/booking-data'
import type { Airport } from '@/lib/rides'

export const metadata: Metadata = { title: 'Book an airport transfer', robots: { index: false } }

export default async function AirportPage() {
  const { supabase, countryCode, countryName, locale, methods } = await getBookingContext('/airport')

  const { data: airports } = await supabase
    .from('airports')
    .select('id, iata, name, city, country_code, lat, lng')
    .eq('country_code', countryCode)
    .eq('is_active', true)
    .order('city')
    .returns<Airport[]>()

  return (
    <main id="main" className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:py-10">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">Airport transfers</h1>
          <p className="mt-1 text-muted-foreground">Fixed prices, flight tracking and meet-and-greet across {countryName}.</p>
        </div>
        <Link href="/ride" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          <Car className="size-4" aria-hidden="true" /> Need a regular ride instead?
        </Link>
      </header>
      <AirportBooker airports={airports ?? []} methods={methods} locale={locale} />
    </main>
  )
}
