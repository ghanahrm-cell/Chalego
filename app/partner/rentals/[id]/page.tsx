import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ListingControls } from '@/components/rentals/listing-controls'
import { VehicleForm } from '@/components/rentals/vehicle-form'
import { requireUser } from '@/lib/session'
import { isAdminRole } from '@/lib/account'
import { LISTING_STATUS_STYLES, RENTAL_SELECT, type RentalCategory, type RentalVehicle } from '@/lib/rentals'
import { cn } from '@/lib/utils'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const LOCALES: Record<string, string> = { GH: 'en-GH', NG: 'en-NG', CI: 'fr-CI' }

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()
  const { supabase, user, profile } = await requireUser(`/partner/rentals/${id}`)
  const { data: v } = await supabase.from('rental_vehicles').select(RENTAL_SELECT).eq('id', id).maybeSingle<RentalVehicle>()
  const canManage = v && (v.owner_id === user.id || (v.owner_id === null && isAdminRole(profile?.role)))
  if (!v || !canManage) notFound()

  const [{ data: categories }, { data: blackouts }] = await Promise.all([
    supabase.from('rental_categories').select('code, kind, name, description, sort_order').order('sort_order').returns<RentalCategory[]>(),
    supabase
      .from('rental_blackouts')
      .select('id, start_at, end_at, reason')
      .eq('vehicle_id', id)
      .gte('end_at', new Date().toISOString())
      .order('start_at')
      .returns<{ id: string; start_at: string; end_at: string; reason: string | null }[]>(),
  ])
  const platform = v.owner_id === null

  return (
    <div className="flex flex-col gap-6">
      <Link href={platform ? '/admin/rentals' : '/partner/rentals'} className="text-sm text-muted-foreground hover:text-foreground">← Back</Link>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-bold tracking-tight">{v.title}</h1>
          <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold capitalize', LISTING_STATUS_STYLES[v.status])}>{v.status}</span>
        </div>
        <Link href={`/rentals/${v.id}`} className="text-sm font-medium text-primary hover:underline">View public page</Link>
      </header>
      {v.status === 'pending' && <p role="status" className="rounded-lg bg-accent/15 px-4 py-3 text-sm">This listing is waiting for review by our team.</p>}
      {v.status === 'rejected' && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Not approved{v.review_note ? `: ${v.review_note}` : '.'} Saving changes resubmits it for review.
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <VehicleForm categories={categories ?? []} vehicle={v} userId={user.id} platform={platform} currency={v.currency} />
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <ListingControls vehicleId={v.id} status={v.status} blackouts={blackouts ?? []} locale={LOCALES[v.country_code] ?? 'en-GH'} />
        </aside>
      </div>
    </div>
  )
}
