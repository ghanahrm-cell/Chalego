import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { RestaurantForm } from '@/components/food/restaurant-form'
import { requireUser } from '@/lib/session'
import { isAdminRole } from '@/lib/account'

export const metadata: Metadata = { title: 'Add restaurant', robots: { index: false } }

export default async function NewRestaurantPage() {
  const { supabase, user, profile } = await requireUser('/partner/food/new')
  const { data: owner } = await supabase.from('rental_owners').select('status').eq('id', user.id).maybeSingle<{ status: string }>()
  if (owner?.status !== 'approved' && !isAdminRole(profile?.role)) redirect('/partner/food')

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/partner/food" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Restaurant dashboard
      </Link>
      <h1 className="font-heading text-3xl font-bold tracking-tight">Add a restaurant</h1>
      <RestaurantForm userId={user.id} defaultCountry={profile?.country_code ?? 'GH'} />
    </div>
  )
}
