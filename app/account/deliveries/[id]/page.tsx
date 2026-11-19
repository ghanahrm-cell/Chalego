import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ShipmentView } from '@/components/shipments/shipment-view'
import { requireUser } from '@/lib/session'
import type { Shipment, ShipmentEvent, TrackingResult } from '@/lib/shipments'

export const metadata: Metadata = { title: 'Delivery details', robots: { index: false } }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function DeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()
  const { supabase, user, country } = await requireUser(`/account/deliveries/${id}`)

  const { data: shipment } = await supabase.from('shipments').select('*').eq('id', id).maybeSingle<Shipment>()
  if (!shipment) notFound()

  const isCustomer = shipment.customer_id === user.id
  const [{ data: events }, { data: secret }, { data: tracking }] = await Promise.all([
    supabase.from('shipment_events').select('status, note, created_at').eq('shipment_id', id).order('created_at').returns<ShipmentEvent[]>(),
    isCustomer
      ? supabase.from('shipment_secrets').select('delivery_code').eq('shipment_id', id).maybeSingle<{ delivery_code: string }>()
      : Promise.resolve({ data: null }),
    supabase.rpc('track_shipment', { p_code: shipment.tracking_code }).returns<TrackingResult>(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <Link href="/account/deliveries" className="inline-flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" /> All deliveries
      </Link>
      <ShipmentView
        initial={shipment}
        initialEvents={events ?? []}
        deliveryCode={secret?.delivery_code ?? null}
        courierName={(tracking as TrackingResult | null)?.courier_name || null}
        isCustomer={isCustomer}
        locale={country?.locale ?? 'en-GH'}
      />
    </div>
  )
}
