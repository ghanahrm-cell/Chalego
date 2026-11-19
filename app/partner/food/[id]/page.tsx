import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { RestaurantForm } from '@/components/food/restaurant-form'
import { OpenToggle } from '@/components/food/open-toggle'
import { MenuManager } from '@/components/food/menu-manager'
import { PromoManager, type Promo } from '@/components/food/promo-manager'
import { requireUser } from '@/lib/session'
import { isAdminRole } from '@/lib/account'
import { FOOD_COUNTRIES, MENU_ITEM_SELECT, RESTAURANT_SELECT, type MenuCategory, type MenuItem, type Restaurant } from '@/lib/food'

export const metadata: Metadata = { title: 'Manage restaurant', robots: { index: false } }

export default async function ManageRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const { supabase, user, profile } = await requireUser(`/partner/food/${id}`)
  const { data: r } = await supabase.from('restaurants').select(RESTAURANT_SELECT).eq('id', id).maybeSingle<Restaurant>()
  if (!r) notFound()
  const isAdmin = isAdminRole(profile?.role)
  if (r.owner_id !== user.id && !isAdmin) redirect('/partner/food')

  const [{ data: cats }, { data: items }, { data: promos }] = await Promise.all([
    supabase.from('menu_categories').select('id, restaurant_id, name, sort_order').eq('restaurant_id', id).order('sort_order').returns<MenuCategory[]>(),
    supabase.from('menu_items').select(MENU_ITEM_SELECT).eq('restaurant_id', id).eq('is_active', true).order('sort_order').order('name').returns<MenuItem[]>(),
    supabase
      .from('food_promos')
      .select('id, code, kind, value, min_subtotal, max_discount, ends_at, max_uses, uses, is_active')
      .eq('restaurant_id', id)
      .order('created_at', { ascending: false })
      .returns<Promo[]>(),
  ])
  const locale = FOOD_COUNTRIES[r.country_code]?.locale ?? 'en-GH'

  return (
    <div className="flex flex-col gap-8">
      <Link href="/partner/food" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Restaurant dashboard
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">{r.name}</h1>
          <Link href={`/food/${r.id}`} className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline">
            View public page <ExternalLink className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
        <OpenToggle id={r.id} open={r.is_open} />
      </header>

      <MenuManager restaurantId={r.id} userId={user.id} currency={r.currency} locale={locale} categories={cats ?? []} items={(items ?? []).map((i) => ({ ...i, price: Number(i.price) }))} />

      <PromoManager restaurantId={r.id} currency={r.currency} locale={locale} promos={promos ?? []} />

      <section aria-labelledby="details" className="flex flex-col gap-3">
        <h2 id="details" className="font-heading text-xl font-semibold">Restaurant details</h2>
        <RestaurantForm userId={user.id} defaultCountry={r.country_code} initial={r} />
      </section>
    </div>
  )
}
