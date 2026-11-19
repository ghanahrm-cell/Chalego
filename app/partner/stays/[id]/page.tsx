import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PropertyForm } from '@/components/stays/property-form'
import { UnitList } from '@/components/stays/unit-list'
import { requireUser } from '@/lib/session'
import { isAdminRole } from '@/lib/account'
import { STAY_COUNTRIES, STAY_PROPERTY_SELECT, STAY_UNIT_SELECT, type StayProperty, type StayUnit } from '@/lib/stays'

export const metadata: Metadata = { title: 'Manage property', robots: { index: false } }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function ManageStayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()
  const { supabase, user, profile } = await requireUser(`/partner/stays/${id}`)
  const { data: p } = await supabase.from('stay_properties').select(STAY_PROPERTY_SELECT).eq('id', id).maybeSingle<StayProperty>()
  const isAdmin = isAdminRole(profile?.role)
  if (!p || (p.owner_id !== user.id && !(isAdmin && p.owner_id === null))) notFound()
  const { data: units } = await supabase.from('stay_units').select(STAY_UNIT_SELECT).eq('property_id', p.id).order('created_at').returns<StayUnit[]>()
  const locale = STAY_COUNTRIES[p.country_code]?.locale ?? 'en-GH'

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link href="/partner/stays" className="hover:text-foreground">Host dashboard</Link>
        <span aria-hidden="true"> / </span>
        <span className="text-foreground">{p.title}</span>
      </nav>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold tracking-tight">{p.title}</h1>
        <Link href={`/stays/${p.id}`} className="text-sm font-medium text-primary hover:underline">View public page</Link>
      </header>

      <section aria-labelledby="units-h" className="flex flex-col gap-3">
        <h2 id="units-h" className="font-heading text-lg font-semibold">{p.kind === 'hotel' ? 'Room types' : 'Units'}</h2>
        {(units ?? []).length === 0 && (
          <p role="status" className="rounded-lg bg-accent/15 px-4 py-3 text-sm">Add at least one {p.kind === 'hotel' ? 'room type' : 'unit'} so guests can book this property.</p>
        )}
        <UnitList propertyId={p.id} kind={p.kind} currency={p.currency} locale={locale} units={units ?? []} />
      </section>

      <section aria-labelledby="details-h" className="flex flex-col gap-3">
        <h2 id="details-h" className="font-heading text-lg font-semibold">Property details</h2>
        <PropertyForm property={p} userId={user.id} isAdmin={false} />
      </section>
    </div>
  )
}
