import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PropertyForm } from '@/components/stays/property-form'
import { requireUser } from '@/lib/session'
import { isAdminRole } from '@/lib/account'

export const metadata: Metadata = { title: 'Add property', robots: { index: false } }

export default async function NewStayPage() {
  const { supabase, user, profile } = await requireUser('/partner/stays/new')
  const isAdmin = isAdminRole(profile?.role)
  const { data: owner } = await supabase.from('rental_owners').select('status').eq('id', user.id).maybeSingle<{ status: string }>()
  if (owner?.status !== 'approved' && !isAdmin) redirect('/partner/stays')

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link href="/partner/stays" className="hover:text-foreground">Host dashboard</Link>
        <span aria-hidden="true"> / </span>
        <span className="text-foreground">New property</span>
      </nav>
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Add a property</h1>
        <p className="mt-1 text-muted-foreground">Create the property first, then add room types or units with their nightly rates.</p>
      </header>
      <PropertyForm userId={user.id} isAdmin={isAdmin && owner?.status !== 'approved'} />
    </div>
  )
}
