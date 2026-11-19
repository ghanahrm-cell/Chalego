import type { Metadata } from 'next'
import { PackageSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShipmentTimeline } from '@/components/shipments/shipment-timeline'
import { fieldClass } from '@/lib/account'
import { createClient } from '@/lib/supabase/server'
import { SHIPMENT_STATUS_LABEL, SHIPMENT_STATUS_STYLE, VEHICLE_LABEL, type TrackingResult } from '@/lib/shipments'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Track a delivery',
  description: 'Track your CHALEGO parcel or cargo shipment with its tracking code.',
}

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const sp = await searchParams
  const code = (sp.code ?? '').trim().toUpperCase().slice(0, 20)
  let result: TrackingResult | null = null
  if (/^CHG[0-9A-F]{8}$/.test(code)) {
    const supabase = await createClient()
    const { data } = await supabase.rpc('track_shipment', { p_code: code })
    result = (data as TrackingResult | null) ?? null
  }

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-10 md:px-6 lg:py-16">
      <header className="mb-6 text-center">
        <PackageSearch className="mx-auto size-10 text-primary" aria-hidden="true" />
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight md:text-4xl">Track a delivery</h1>
        <p className="mt-1 text-muted-foreground">Enter the tracking code from your booking or SMS.</p>
      </header>

      <form action="/track" className="flex gap-2">
        <label htmlFor="code" className="sr-only">Tracking code</label>
        <input id="code" name="code" defaultValue={code} placeholder="e.g. CHG1A2B3C4D" className={cn(fieldClass, 'font-mono uppercase')} required autoComplete="off" />
        <Button type="submit" className="h-11 px-5">Track</Button>
      </form>

      {code && !result && (
        <p role="alert" className="mt-6 rounded-lg bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
          {"We couldn't find a delivery with that code. Check it and try again."}
        </p>
      )}

      {result && (
        <section aria-label="Tracking result" className="mt-8 rounded-2xl border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-sm text-muted-foreground">{result.tracking_code}</p>
              <p className="font-semibold">
                {result.pickup_area} to {result.dropoff_area}
              </p>
              <p className="text-sm text-muted-foreground">
                {VEHICLE_LABEL[result.vehicle_class]}
                {result.courier_name ? ` · Courier ${result.courier_name}` : ''}
              </p>
            </div>
            <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', SHIPMENT_STATUS_STYLE[result.status])}>{SHIPMENT_STATUS_LABEL[result.status]}</span>
          </div>
          <div className="mt-6">
            <ShipmentTimeline status={result.status} events={result.events} locale="en-GH" />
          </div>
        </section>
      )}
    </main>
  )
}
