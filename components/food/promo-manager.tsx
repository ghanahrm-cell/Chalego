'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { fieldClass, formatMoney } from '@/lib/account'
import { errorMessage } from '@/lib/rides'

export type Promo = {
  id: string
  code: string
  kind: 'percent' | 'fixed'
  value: number
  min_subtotal: number
  max_discount: number | null
  ends_at: string | null
  max_uses: number | null
  uses: number
  is_active: boolean
}

export function PromoManager({ restaurantId, currency, locale, promos }: { restaurantId: string; currency: string; locale: string; promos: Promo[] }) {
  const base = useId()
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState('')
  const money = (n: number) => formatMoney(Number(n), currency, locale)
  const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' })

  async function save(key: string, id: string | null, p: Record<string, unknown>, form?: HTMLFormElement) {
    setPending(key)
    setError('')
    const { error } = await createClient().rpc('save_food_promo', { p_id: id, p })
    setPending(null)
    if (error) return setError(errorMessage(error))
    form?.reset()
    router.refresh()
  }

  const field = (name: string, label: string, el: React.ReactElement) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`${base}-${name}`} className="text-xs font-semibold text-muted-foreground">{label}</label>
      {el}
    </div>
  )

  return (
    <section aria-labelledby={`${base}-h`} className="flex flex-col gap-4">
      <div>
        <h2 id={`${base}-h`} className="font-heading text-xl font-semibold">Promotions</h2>
        <p className="text-sm text-muted-foreground">Discount codes you fund. Customers enter them at checkout.</p>
      </div>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {promos.length > 0 && (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {promos.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-mono font-semibold">{p.code}</p>
                <p className="text-sm text-muted-foreground">
                  {p.kind === 'percent' ? `${Number(p.value)}% off` : `${money(p.value)} off`}
                  {Number(p.min_subtotal) > 0 && ` · min ${money(p.min_subtotal)}`}
                  {p.max_discount && ` · up to ${money(p.max_discount)}`}
                  {` · used ${p.uses}${p.max_uses ? `/${p.max_uses}` : ''}`}
                  {p.ends_at && ` · ends ${date.format(new Date(p.ends_at))}`}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-9"
                disabled={pending === p.id}
                onClick={() =>
                  save(p.id, p.id, {
                    code: p.code,
                    kind: p.kind,
                    value: p.value,
                    min_subtotal: p.min_subtotal,
                    max_discount: p.max_discount ?? '',
                    ends_at: p.ends_at ?? '',
                    max_uses: p.max_uses ?? '',
                    is_active: !p.is_active,
                  })
                }
              >
                {pending === p.id ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : p.is_active ? 'Pause' : 'Resume'}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-3 lg:grid-cols-6"
        onSubmit={(e) => {
          e.preventDefault()
          const f = new FormData(e.currentTarget)
          const ends = String(f.get('ends_at') ?? '')
          save(
            'new',
            null,
            {
              restaurant_id: restaurantId,
              code: String(f.get('code') ?? '').toUpperCase(),
              kind: f.get('kind'),
              value: Number(f.get('value')),
              min_subtotal: Number(f.get('min_subtotal') || 0),
              max_discount: f.get('max_discount') || '',
              ends_at: ends ? new Date(`${ends}T23:59:59`).toISOString() : '',
              max_uses: f.get('max_uses') || '',
            },
            e.currentTarget,
          )
        }}
      >
        {field('code', 'Code', <input id={`${base}-code`} name="code" required pattern="[A-Za-z0-9]{3,20}" maxLength={20} placeholder="CHOP10" className={`${fieldClass} font-mono uppercase`} />)}
        {field(
          'kind',
          'Type',
          <select id={`${base}-kind`} name="kind" className={fieldClass}>
            <option value="percent">Percent off</option>
            <option value="fixed">Amount off</option>
          </select>,
        )}
        {field('value', 'Discount', <input id={`${base}-value`} name="value" type="number" min={0.01} step="0.01" required className={fieldClass} />)}
        {field('min_subtotal', 'Min order', <input id={`${base}-min_subtotal`} name="min_subtotal" type="number" min={0} step="0.01" className={fieldClass} />)}
        {field('max_uses', 'Max uses', <input id={`${base}-max_uses`} name="max_uses" type="number" min={1} className={fieldClass} />)}
        {field('ends_at', 'Ends', <input id={`${base}-ends_at`} name="ends_at" type="date" className={fieldClass} />)}
        <input type="hidden" name="max_discount" value="" />
        <Button type="submit" className="h-11 sm:col-span-3 lg:col-span-6 lg:justify-self-start lg:px-6" disabled={pending === 'new'}>
          {pending === 'new' && <Loader2 className="size-4 animate-spin" aria-hidden="true" />} Create promo
        </Button>
      </form>
    </section>
  )
}
