'use client'

import { useId, useMemo, useState } from 'react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Loader2, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LocationInput } from '@/components/rides/location-input'
import { PaymentSelect } from '@/components/rides/payment-select'
import { createClient } from '@/lib/supabase/client'
import { fieldClass, formatMoney, type PaymentMethod } from '@/lib/account'
import { errorMessage, type Place } from '@/lib/rides'
import type { Fulfilment, FoodQuote, MenuCategory, MenuItem } from '@/lib/food'
import { cn } from '@/lib/utils'

type RestaurantInfo = {
  id: string
  name: string
  country: string
  currency: string
  isOpen: boolean
  offersDelivery: boolean
  offersPickup: boolean
  minOrder: number
  isOwn: boolean
}

type CartLine = { key: string; itemId: string; name: string; unit: number; addons: string[]; qty: number }

type Props = {
  restaurant: RestaurantInfo
  categories: MenuCategory[]
  items: MenuItem[]
  methods: PaymentMethod[]
  locale: string
  loggedIn: boolean
}

type QuoteKey = [string, string, string, Fulfilment, number | null, number | null, string]

async function fetchQuote([, restaurant, items, fulfilment, lat, lng, promo]: QuoteKey) {
  const { data, error } = await createClient().rpc('food_quote', {
    p_restaurant: restaurant,
    p_items: JSON.parse(items),
    p_fulfilment: fulfilment,
    p_lat: lat,
    p_lng: lng,
    p_promo: promo || null,
  })
  if (error) throw error
  return data as FoodQuote
}

export function FoodOrdering({ restaurant: r, categories, items, methods, locale, loggedIn }: Props) {
  const base = useId()
  const router = useRouter()
  const pathname = usePathname()
  const money = (n: number) => formatMoney(n, r.currency, locale)
  const [cart, setCart] = useState<CartLine[]>([])
  const [picking, setPicking] = useState<string | null>(null)
  const [chosen, setChosen] = useState<string[]>([])
  const [fulfilment, setFulfilment] = useState<Fulfilment>(r.offersDelivery ? 'delivery' : 'pickup')
  const [place, setPlace] = useState<Place | null>(null)
  const [promoInput, setPromoInput] = useState('')
  const [promo, setPromo] = useState('')
  const [payment, setPayment] = useState(methods[0]?.provider ?? '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const sections = useMemo(() => {
    const groups = categories
      .map((c) => ({ id: c.id, name: c.name, items: items.filter((i) => i.category_id === c.id) }))
      .filter((g) => g.items.length)
    const loose = items.filter((i) => !i.category_id || !categories.some((c) => c.id === i.category_id))
    return loose.length ? [...groups, { id: 'other', name: groups.length ? 'More' : 'Menu', items: loose }] : groups
  }, [categories, items])

  const payload = JSON.stringify(cart.map((l) => ({ item_id: l.itemId, qty: l.qty, addons: l.addons })))
  const needsPlace = fulfilment === 'delivery' && !place
  const quoteKey: QuoteKey | null =
    cart.length && !needsPlace ? ['food-quote', r.id, payload, fulfilment, place?.lat ?? null, place?.lng ?? null, promo] : null
  const { data: quote, isLoading: quoting } = useSWR(quoteKey, fetchQuote, { keepPreviousData: true })
  const localSubtotal = cart.reduce((s, l) => s + l.unit * l.qty, 0)
  const count = cart.reduce((s, l) => s + l.qty, 0)
  const quoteError = quote?.error

  function add(item: MenuItem, addons: string[]) {
    const extras = item.addons.filter((a) => addons.includes(a.name)).reduce((s, a) => s + Number(a.price), 0)
    const key = `${item.id}:${[...addons].sort().join('|')}`
    setCart((c) => {
      const hit = c.find((l) => l.key === key)
      if (hit) return c.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + 1, 20) } : l))
      return [...c, { key, itemId: item.id, name: item.name, unit: item.price + extras, addons, qty: 1 }]
    })
    setPicking(null)
    setChosen([])
  }

  function setQty(key: string, qty: number) {
    setCart((c) => (qty <= 0 ? c.filter((l) => l.key !== key) : c.map((l) => (l.key === key ? { ...l, qty: Math.min(qty, 20) } : l))))
  }

  async function placeOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!loggedIn) return router.push(`/auth/login?next=${encodeURIComponent(pathname)}`)
    const form = new FormData(e.currentTarget)
    const details = String(form.get('details') ?? '').trim()
    setPending(true)
    setError('')
    const { data, error } = await createClient().rpc('place_food_order', {
      p_restaurant: r.id,
      p_items: JSON.parse(payload),
      p_fulfilment: fulfilment,
      p_address: fulfilment === 'delivery' ? [place?.label, details].filter(Boolean).join(' · ') : null,
      p_lat: fulfilment === 'delivery' ? place?.lat ?? null : null,
      p_lng: fulfilment === 'delivery' ? place?.lng ?? null : null,
      p_payment_method: payment,
      p_promo: promo || null,
      p_note: String(form.get('note') ?? ''),
    })
    if (error) {
      setPending(false)
      return setError(errorMessage(error))
    }
    router.push(`/account/food/${data}`)
  }

  const blocked = !r.isOpen || r.isOwn
  const canSubmit = cart.length > 0 && !needsPlace && quote && !quoteError && !quoting && payment && !blocked && !pending

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-8">
        {sections.length > 1 && (
          <nav aria-label="Menu sections" className="sticky top-16 z-10 -mx-4 flex gap-2 overflow-x-auto bg-background/95 px-4 py-2 backdrop-blur md:mx-0 md:px-0">
            {sections.map((s) => (
              <a key={s.id} href={`#${base}-${s.id}`} className="shrink-0 rounded-full border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                {s.name}
              </a>
            ))}
          </nav>
        )}
        {sections.length === 0 && (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">This restaurant has not added its menu yet.</p>
        )}
        {sections.map((s) => (
          <section key={s.id} id={`${base}-${s.id}`} aria-labelledby={`${base}-${s.id}-h`} className="scroll-mt-32">
            <h2 id={`${base}-${s.id}-h`} className="mb-3 font-heading text-xl font-semibold">{s.name}</h2>
            <ul className="grid gap-3 md:grid-cols-2">
              {s.items.map((item) => (
                <li key={item.id} className={cn('flex flex-col gap-3 rounded-2xl border bg-card p-4', !item.is_available && 'opacity-60')}>
                  <div className="flex gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium leading-snug">{item.name}</h3>
                      {item.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>}
                      <p className="mt-2 font-semibold">{money(item.price)}</p>
                    </div>
                    {item.photo_url && (
                      <Image src={item.photo_url} alt="" width={96} height={96} className="size-24 shrink-0 rounded-xl object-cover" />
                    )}
                  </div>
                  {!item.is_available ? (
                    <p className="text-sm font-medium text-muted-foreground">Sold out</p>
                  ) : picking === item.id ? (
                    <fieldset className="flex flex-col gap-2 rounded-xl bg-muted/60 p-3">
                      <legend className="sr-only">Add-ons for {item.name}</legend>
                      {item.addons.map((a) => (
                        <label key={a.name} className="flex items-center justify-between gap-3 text-sm">
                          <span className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={chosen.includes(a.name)}
                              onChange={(e) => setChosen((c) => (e.target.checked ? [...c, a.name] : c.filter((x) => x !== a.name)))}
                              className="size-4 accent-primary"
                            />
                            {a.name}
                          </span>
                          <span className="text-muted-foreground">{Number(a.price) > 0 ? `+${money(Number(a.price))}` : 'Free'}</span>
                        </label>
                      ))}
                      <div className="mt-1 flex gap-2">
                        <Button type="button" className="h-10 flex-1" onClick={() => add(item, chosen)}>Add to order</Button>
                        <Button type="button" variant="ghost" className="h-10" onClick={() => setPicking(null)}>Cancel</Button>
                      </div>
                    </fieldset>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 self-start"
                      disabled={blocked}
                      onClick={() => {
                        if (item.addons.length) {
                          setPicking(item.id)
                          setChosen([])
                        } else add(item, [])
                      }}
                    >
                      <Plus data-icon="inline-start" aria-hidden="true" /> {item.addons.length ? 'Choose options' : 'Add'}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <aside aria-labelledby={`${base}-cart`} className="lg:sticky lg:top-20 lg:self-start">
        <form onSubmit={placeOrder} className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
          <h2 id={`${base}-cart`} className="flex items-center gap-2 font-heading text-lg font-semibold">
            <ShoppingBag className="size-5" aria-hidden="true" /> Your order
            {count > 0 && <span className="ml-auto text-sm font-normal text-muted-foreground">{count} item{count === 1 ? '' : 's'}</span>}
          </h2>

          {!r.isOpen && <p role="status" className="rounded-lg bg-muted px-3 py-2 text-sm">{r.name} is closed right now. Check back during opening hours.</p>}
          {r.isOwn && <p role="status" className="rounded-lg bg-muted px-3 py-2 text-sm">This is your restaurant. Customers order from this page.</p>}

          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add dishes from the menu to start your order.</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {cart.map((l) => (
                <li key={l.key} className="flex items-start gap-3 py-3 first:pt-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{l.name}</p>
                    {l.addons.length > 0 && <p className="text-xs text-muted-foreground">{l.addons.join(', ')}</p>}
                    <p className="text-sm text-muted-foreground">{money(l.unit * l.qty)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setQty(l.key, l.qty - 1)} aria-label={l.qty === 1 ? `Remove ${l.name}` : `One less ${l.name}`} className="flex size-8 items-center justify-center rounded-full border hover:bg-muted">
                      {l.qty === 1 ? <Trash2 className="size-3.5" aria-hidden="true" /> : <Minus className="size-3.5" aria-hidden="true" />}
                    </button>
                    <span className="w-6 text-center text-sm font-medium" aria-label={`Quantity ${l.qty}`}>{l.qty}</span>
                    <button type="button" onClick={() => setQty(l.key, l.qty + 1)} aria-label={`One more ${l.name}`} disabled={l.qty >= 20} className="flex size-8 items-center justify-center rounded-full border hover:bg-muted disabled:opacity-40">
                      <Plus className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {cart.length > 0 && (
            <>
              {r.offersDelivery && r.offersPickup && (
                <div role="radiogroup" aria-label="Delivery or pickup" className="grid grid-cols-2 rounded-xl border p-1">
                  {(['delivery', 'pickup'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      role="radio"
                      aria-checked={fulfilment === f}
                      onClick={() => setFulfilment(f)}
                      className={cn('rounded-lg py-2 text-sm font-medium capitalize', fulfilment === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}

              {fulfilment === 'delivery' ? (
                <div className="flex flex-col gap-2">
                  <LocationInput label="Deliver to" country={r.country} value={place} onChange={setPlace} placeholder="Search your street or area" allowCurrentLocation />
                  <label htmlFor={`${base}-details`} className="sr-only">Apartment, landmark or gate details</label>
                  <input id={`${base}-details`} name="details" maxLength={80} placeholder="House number, landmark or gate (optional)" className={fieldClass} />
                </div>
              ) : (
                <p className="rounded-lg bg-muted px-3 py-2 text-sm">You will collect from the restaurant and show your 4-digit PIN at the counter.</p>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${base}-promo`} className="text-xs font-semibold text-muted-foreground">Promo code</label>
                <div className="flex gap-2">
                  <input
                    id={`${base}-promo`}
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20))}
                    placeholder="e.g. CHOP10"
                    className={fieldClass}
                  />
                  {promo ? (
                    <Button type="button" variant="outline" className="h-11" onClick={() => { setPromo(''); setPromoInput('') }}>Remove</Button>
                  ) : (
                    <Button type="button" variant="outline" className="h-11" disabled={promoInput.length < 3} onClick={() => setPromo(promoInput)}>Apply</Button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${base}-note`} className="text-xs font-semibold text-muted-foreground">Instructions for the kitchen (optional)</label>
                <textarea id={`${base}-note`} name="note" rows={2} maxLength={300} placeholder="Less pepper, no onions, extra napkins..." className={cn(fieldClass, 'h-auto py-2')} />
              </div>

              <PaymentSelect methods={methods} value={payment} onChange={setPayment} />

              <dl className="flex flex-col gap-1.5 border-t pt-4 text-sm" aria-live="polite">
                <Row label="Subtotal" value={money(quote && !quoteError ? quote.subtotal : localSubtotal)} />
                {quote && !quoteError && (
                  <>
                    {quote.discount > 0 && <Row label={`Promo ${quote.promo_code}`} value={`−${money(quote.discount)}`} />}
                    {fulfilment === 'delivery' && <Row label={`Delivery${quote.distance_km ? ` · ${quote.distance_km} km` : ''}`} value={money(quote.delivery_fee)} />}
                    {quote.tax > 0 && <Row label={`Tax (${quote.tax_rate}%)`} value={money(quote.tax)} />}
                    <div className="mt-1 flex justify-between border-t pt-2 text-base font-semibold">
                      <dt>Total</dt>
                      <dd>{money(quote.total)}</dd>
                    </div>
                  </>
                )}
              </dl>
              {needsPlace && <p className="text-sm text-muted-foreground">Choose a delivery address to see the delivery fee.</p>}
              {quoteError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{quoteError}</p>}
              {r.minOrder > 0 && localSubtotal < r.minOrder && (
                <p className="text-sm text-muted-foreground">Minimum order is {money(r.minOrder)}.</p>
              )}
            </>
          )}

          {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <Button type="submit" className="h-12 text-base" disabled={!canSubmit}>
            {pending || (quoting && cart.length > 0) ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {loggedIn ? (quote && !quoteError ? `Place order · ${money(quote.total)}` : 'Place order') : 'Log in to order'}
          </Button>
          {methods.length === 0 && <p className="text-xs text-muted-foreground">Online ordering is not yet available in this country.</p>}
        </form>
      </aside>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
