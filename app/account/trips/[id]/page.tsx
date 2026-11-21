import { notFound } from 'next/navigation'
import { PayByCardPanel } from '@/components/payments/pay-by-card-panel'
import { TripView } from '@/components/rides/trip-view'
import { requireUser } from '@/lib/session'
import type { RideDetails } from '@/lib/rides'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const metadata = { title: 'Trip details | CHALEGO', robots: { index: false } }

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()
  const { supabase, user, country } = await requireUser(`/account/trips/${id}`)
  const { data } = await supabase.rpc('ride_details', { p_ride_id: id })
  if (!data) notFound()
  return (
    <div className="flex flex-col gap-6">
      <TripView initial={data as RideDetails} userId={user.id} locale={country?.locale ?? 'en-GH'} />
      <div className="max-w-md">
        <PayByCardPanel kind="ride" id={id} userId={user.id} locale={country?.locale ?? 'en-GH'} />
      </div>
    </div>
  )
}
