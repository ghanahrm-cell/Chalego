import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Check, MapPin, Phone } from 'lucide-react'
import { FoodOrderActions } from '@/components/food/food-order-actions'
import { PayByCardPanel } from '@/components/payments/pay-by-card-panel'
import { requireUser } from '@/lib/session'
import { formatMoney, isAdminRole } from '@/lib/account'
import { FOOD_ACTIVE, FOOD_ORDER_SELECT, FOOD_STATUS_LABELS, FOOD_STATUS_STYLES, foodSteps, type FoodOrder } from '@/lib/food'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Food order', robots: { index: false } }

type Contact = { name: string; phone: string | null }

export default async function FoodOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const { supabase, user, profile, country } = await requireUser(`/account/food/${id}`)
  const { data: o } = await supabase.from('food_orders').select(FOOD_ORDER_SELECT).eq('id', id).maybeSingle<FoodOrder>()
  if (!o) notFound()
  const locale = country?.locale ?? 'en-GH'
  const money = (n: number | null) => formatMoney(Number(n ?? 0), o.currency, locale)
  const isAdmin = isAdminRole(profile?.role)
  const viewer =
    o.customer_id === user.id ? 'customer' : o.courier_id === user.id ? 'courier' : o.owner_id === user.id || (isAdmin && o.owner_id === null) ? 'restaurant' : 'admin'
  const active = FOOD_ACTIVE.includes(o.status)

  const [{ data: rest }, { data: pin }, { data: contacts }] = await Promise.all([
    supabase.from('restaurants').select('name, address, city, phone').eq('id', o.restaurant_id).maybeSingle<{ name: string; address: string; city: string; phone: string | null }>(),
    viewer === 'customer' && active ? supabase.rpc('food_order_pin', { p_id: o.id }) : Promise.resolve({ data: null }),
    active ? supabase.rpc('food_order_contacts', { p_id: o.id }) : Promise.resolve({ data: null }),
  ])
  const c = (contacts ?? {}) as { courier?: Contact; customer?: Contact }
  const steps = foodSteps(o.fulfilment)
  const reached = steps.findIndex((s) => s.status === o.status)
  const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' })
  const back = viewer === 'restaurant' ? '/partner/food' : viewer === 'courier' ? '/driver' : viewer === 'admin' ? '/admin' : '/account/food'

  return (
    <div className="flex flex-col gap-6">
      <Link href={back} className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{o.reference} · <span className="capitalize">{o.fulfilment}</span></p>
          <h1 className="font-heading text-2xl font-bold tracking-tight">{rest?.name ?? 'Food order'}</h1>
        </div>
        <span className={cn('rounded-full px-3 py-1 text-sm font-semibold', FOOD_STATUS_STYLES[o.status])}>{FOOD_STATUS_LABELS[o.status]}</span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          {['cancelled', 'rejected'].includes(o.status) ? (
            <p role="status" className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
              {o.status === 'rejected' ? 'The restaurant could not take this order.' : `Cancelled${o.cancelled_by ? ` by ${o.cancelled_by}` : ''}.`}
              {(o.cancel_reason || o.restaurant_note) && ` “${o.cancel_reason ?? o.restaurant_note}”`}
            </p>
          ) : (
            <section aria-label="Order progress" className="rounded-2xl border bg-card p-5">
              <ol className="flex flex-col gap-3 sm:flex-row sm:gap-0">
                {steps.map((s, i) => (
                  <li key={s.status} className="flex items-center gap-3 sm:flex-1 sm:flex-col sm:gap-2 sm:text-center">
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold',
                        i <= reached ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground',
                      )}
                      aria-hidden="true"
                    >
                      {i < reached || o.status === 'completed' ? <Check className="size-4" /> : i + 1}
                    </span>
                    <span className={cn('text-sm', i === reached ? 'font-semibold' : i < reached ? '' : 'text-muted-foreground')}>
                      {s.label}
                      {i === reached && <span className="sr-only"> (current step)</span>}
                    </span>
                  </li>
                ))}
              </ol>
              {o.estimated_ready_at && ['accepted', 'preparing'].includes(o.status) && (
                <p className="mt-4 text-sm text-muted-foreground">Estimated ready by {time.format(new Date(o.estimated_ready_at))}</p>
              )}
            </section>
          )}

          {typeof pin === 'string' && (
            <section className="flex items-center justify-between gap-4 rounded-2xl bg-ink p-5 text-ink-foreground">
              <div>
                <h2 className="font-heading font-semibold">Your handover PIN</h2>
                <p className="text-sm text-ink-foreground/75">
                  {o.fulfilment === 'delivery' ? 'Give this to your rider only when you have your food.' : 'Show this at the counter to collect your order.'}
                </p>
              </div>
              <p className="font-mono text-3xl font-bold tracking-[0.3em]" aria-label={`PIN ${pin.split('').join(' ')}`}>{pin}</p>
            </section>
          )}

          <section aria-labelledby="items" className="rounded-2xl border bg-card p-5">
            <h2 id="items" className="mb-3 font-heading font-semibold">Items</h2>
            <ul className="flex flex-col divide-y">
              {o.items.map((l, i) => (
                <li key={i} className="flex justify-between gap-3 py-2.5 text-sm">
                  <span>
                    <span className="font-medium">{l.qty}×</span> {l.name}
                    {l.addons.length > 0 && <span className="block text-xs text-muted-foreground">{l.addons.map((a) => a.name).join(', ')}</span>}
                  </span>
                  <span>{money(l.line_total)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 flex flex-col gap-1.5 border-t pt-3 text-sm">
              <Line label="Subtotal" value={money(o.subtotal)} />
              {Number(o.discount_amount) > 0 && <Line label={`Promo ${o.promo_code ?? ''}`} value={`−${money(o.discount_amount)}`} />}
              {o.fulfilment === 'delivery' && <Line label={`Delivery${o.distance_km ? ` · ${o.distance_km} km` : ''}`} value={money(o.delivery_fee)} />}
              {Number(o.tax_amount) > 0 && <Line label="Tax" value={money(o.tax_amount)} />}
              <div className="flex justify-between border-t pt-2 font-semibold">
                <dt>Total</dt>
                <dd>{money(o.total_amount)}</dd>
              </div>
              <Line label="Payment" value={o.payment_method.replace(/_/g, ' ')} />
              {viewer !== 'customer' && o.restaurant_earnings !== null && <Line label="Restaurant earnings" value={money(o.restaurant_earnings)} />}
              {viewer === 'courier' && o.courier_earnings !== null && <Line label="Your earnings" value={money(o.courier_earnings)} />}
            </dl>
            {o.customer_note && <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm"><span className="font-medium">Note:</span> {o.customer_note}</p>}
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-3 rounded-2xl border bg-card p-5 text-sm">
            <h2 className="font-heading text-base font-semibold">Details</h2>
            {rest && (
              <p className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span><span className="font-medium">{rest.name}</span><br />{rest.address}, {rest.city}</span>
              </p>
            )}
            {o.delivery_address && (
              <p className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span><span className="font-medium">Deliver to</span><br />{o.delivery_address}</span>
              </p>
            )}
            {viewer === 'customer' && rest?.phone && active && <ContactLine label="Restaurant" c={{ name: rest.name, phone: rest.phone }} />}
            {c.courier && viewer !== 'courier' && <ContactLine label="Rider" c={c.courier} />}
            {c.customer && viewer !== 'customer' && <ContactLine label="Customer" c={c.customer} />}
            {o.fulfilment === 'delivery' && !o.courier_id && ['accepted', 'preparing', 'ready'].includes(o.status) && (
              <p className="text-muted-foreground">Finding a rider near the restaurant…</p>
            )}
          </section>
          {viewer === 'customer' && <PayByCardPanel kind="food" id={o.id} userId={user.id} locale={locale} />}
          <FoodOrderActions id={o.id} status={o.status} fulfilment={o.fulfilment} viewer={viewer} rated={o.rating !== null} active={active} />
        </div>
      </div>
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="capitalize">{value}</dd>
    </div>
  )
}

function ContactLine({ label, c }: { label: string; c: Contact }) {
  return (
    <p className="flex items-center justify-between gap-2">
      <span><span className="text-muted-foreground">{label}:</span> {c.name}</span>
      {c.phone && (
        <a href={`tel:${c.phone}`} className="flex items-center gap-1 font-medium text-primary hover:underline">
          <Phone className="size-4" aria-hidden="true" /> Call
        </a>
      )}
    </p>
  )
}
