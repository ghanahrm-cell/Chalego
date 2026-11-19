'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Loader2, MapPin, UtensilsCrossed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PinForm } from '@/components/food/food-order-actions'
import { createClient } from '@/lib/supabase/client'
import { formatMoney } from '@/lib/account'
import { errorMessage } from '@/lib/rides'
import { FOOD_STATUS_LABELS, FOOD_STATUS_STYLES, type FoodStatus } from '@/lib/food'
import { cn } from '@/lib/utils'

type Job = {
  id: string
  reference: string
  status: FoodStatus
  restaurant_name: string
  restaurant_address: string
  delivery_address: string | null
  distance_km: number | null
  est_earnings: number
  currency: string
  item_count: number
  estimated_ready_at: string | null
}

type Mine = { id: string; reference: string; status: FoodStatus; delivery_address: string | null; delivery_fee: number; currency: string; restaurant_id: string }

async function loadAvailable() {
  const { data, error } = await createClient().rpc('available_food_jobs')
  if (error) throw error
  return (data ?? []) as Job[]
}

async function loadMine([, id]: [string, string]) {
  const { data, error } = await createClient()
    .from('food_orders')
    .select('id, reference, status, delivery_address, delivery_fee, currency, restaurant_id')
    .eq('courier_id', id)
    .in('status', ['accepted', 'preparing', 'ready', 'picked_up'])
    .order('courier_assigned_at')
    .returns<Mine[]>()
  if (error) throw error
  return data ?? []
}

export function FoodJobs({ courierId, enabled, locale }: { courierId: string; enabled: boolean; locale: string }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const { data: available, mutate: refreshAvailable } = useSWR(enabled ? 'available-food-jobs' : null, loadAvailable, { refreshInterval: 8000 })
  const { data: mine, mutate: refreshMine } = useSWR(enabled ? ['my-food-jobs', courierId] : null, loadMine, { refreshInterval: 10000 })
  const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' })

  if (!enabled) return null

  async function run(id: string, fn: string, args: Record<string, unknown>, onData?: (d: unknown) => void) {
    setBusy(id)
    setError('')
    setNotice('')
    const { data, error } = await createClient().rpc(fn, args)
    if (error) setError(errorMessage(error))
    else onData?.(data)
    await Promise.all([refreshAvailable(), refreshMine()])
    setBusy(null)
  }

  return (
    <section aria-labelledby="food-jobs" className="mx-auto mt-8 flex w-full max-w-5xl flex-col gap-4 px-4 pb-12 md:px-6">
      <h2 id="food-jobs" className="flex items-center gap-2 font-heading text-xl font-semibold">
        <UtensilsCrossed className="size-5 text-primary" aria-hidden="true" /> Food deliveries
      </h2>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-accent/15 px-3 py-2 text-sm">{notice}</p>}

      {(mine ?? []).length > 0 && (
        <ul className="flex flex-col gap-3">
          {mine!.map((o) => (
            <li key={o.id} className="flex flex-col gap-3 rounded-2xl border-2 border-primary/40 bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <Link href={`/account/food/${o.id}`} className="font-medium hover:underline">{o.reference}</Link>
                <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', FOOD_STATUS_STYLES[o.status])}>{FOOD_STATUS_LABELS[o.status]}</span>
              </div>
              {o.delivery_address && (
                <p className="flex gap-2 text-sm"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />{o.delivery_address}</p>
              )}
              {['accepted', 'preparing'].includes(o.status) && <p className="text-sm text-muted-foreground">Head to the restaurant. Pick up unlocks once the kitchen marks it ready.</p>}
              {o.status === 'ready' && (
                <Button type="button" className="h-11" disabled={busy === o.id} onClick={() => run(o.id, 'pickup_food_order', { p_id: o.id })}>
                  {busy === o.id ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : 'Confirm pickup'}
                </Button>
              )}
              {o.status === 'picked_up' && (
                <PinForm
                  id={`pin-${o.id}`}
                  busy={busy === o.id}
                  label="Delivered"
                  onSubmit={(pin) =>
                    run(o.id, 'complete_food_order', { p_id: o.id, p_pin: pin }, (ok) => {
                      if (ok === false) setNotice('Wrong PIN. Ask the customer to read it from their order page.')
                      else setNotice('Delivery complete. Nice work.')
                    })
                  }
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {(available ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">No food deliveries waiting near you right now.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {available!.map((j) => (
            <li key={j.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{j.restaurant_name}</p>
                  <p className="text-sm text-muted-foreground">{j.restaurant_address}</p>
                </div>
                <p className="font-heading text-lg font-bold text-primary">{formatMoney(Number(j.est_earnings), j.currency, locale)}</p>
              </div>
              <p className="flex gap-2 text-sm"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{j.delivery_address}</p>
              <p className="text-xs text-muted-foreground">
                {j.item_count} item{j.item_count === 1 ? '' : 's'}
                {j.distance_km != null && ` · ${j.distance_km} km`}
                {` · ${FOOD_STATUS_LABELS[j.status]}`}
                {j.estimated_ready_at && ` · ready ~${time.format(new Date(j.estimated_ready_at))}`}
              </p>
              <Button type="button" className="h-11" disabled={busy === j.id} onClick={() => run(j.id, 'accept_food_job', { p_id: j.id })}>
                {busy === j.id ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : 'Accept delivery'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
