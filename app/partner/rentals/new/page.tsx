import Link from 'next/link'
import { redirect } from 'next/navigation'
import { VehicleForm } from '@/components/rentals/vehicle-form'
import { requireUser } from '@/lib/session'
import { isAdminRole } from '@/lib/account'
import type { RentalCategory } from '@/lib/rentals'

export default async function NewListingPage({ searchParams }: { searchParams: Promise<{ platform?: string }> }) {
  const { platform: platformParam } = await searchParams
  const { supabase, user, profile, country } = await requireUser('/partner/rentals/new')
  const platform = platformParam === '1' && isAdminRole(profile?.role)
  if (!platform) {
    const { data: owner } = await supabase.from('rental_owners').select('status').eq('id', user.id).maybeSingle<{ status: string }>()
    if (owner?.status !== 'approved') redirect('/partner/rentals')
  }
  const { data: categories } = await supabase
    .from('rental_categories')
    .select('code, kind, name, description, sort_order')
    .order('sort_order')
    .returns<RentalCategory[]>()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href={platform ? '/admin/rentals' : '/partner/rentals'} className="text-sm text-muted-foreground hover:text-foreground">← Back</Link>
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">{platform ? 'Add a CHALEGO Fleet vehicle' : 'Add a listing'}</h1>
        <p className="mt-1 text-muted-foreground">Clear photos and accurate details get more bookings.</p>
      </header>
      <VehicleForm categories={categories ?? []} vehicle={null} userId={user.id} platform={platform} currency={platform ? 'local currency' : country?.currency_code ?? 'GHS'} />
    </div>
  )
}
