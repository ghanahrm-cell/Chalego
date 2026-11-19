'use client'

import { useEffect, useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { fieldClass } from '@/lib/account'
import { errorMessage } from '@/lib/rides'
import type { FoodStatus, Fulfilment } from '@/lib/food'
import { cn } from '@/lib/utils'

type Props = {
  id: string
  status: FoodStatus
  fulfilment: Fulfilment
  viewer: 'customer' | 'restaurant' | 'courier' | 'admin'
  rated: boolean
  active: boolean
}

const Spinner = () => <Loader2 className="size-4 animate-spin" aria-hidden="true" />

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
      <h2 className="font-heading text-base font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export function FoodOrderActions({ id, status, fulfilment, viewer, rated, active }: Props) {
  const base = useId()
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [rating, setRating] = useState(0)

  useEffect(() => {
    if (!active) return
    const t = setInterval(() => router.refresh(), 15000)
    return () => clearInterval(t)
  }, [active, router])

  async function run(key: string, fn: string, args: Record<string, unknown>, onData?: (d: unknown) => void) {
    setPending(key)
    setError('')
    setNotice('')
    const { data, error } = await createClient().rpc(fn, args)
    setPending(null)
    if (error) return setError(errorMessage(error))
    onData?.(data)
    router.refresh()
  }

  const kitchen = viewer === 'restaurant'
  const canCancel =
    (viewer === 'customer' && status === 'placed') ||
    (kitchen && ['accepted', 'preparing', 'ready'].includes(status)) ||
    (viewer === 'admin' && active)

  return (
    <div className="flex flex-col gap-4">
      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-accent/15 px-3 py-2 text-sm">{notice}</p>}

      {kitchen && status === 'placed' && (
        <Panel title="New order">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              const accept = (e.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'accept'
              const f = new FormData(e.currentTarget)
              run(accept ? 'accept' : 'decline', 'respond_food_order', {
                p_id: id,
                p_accept: accept,
                p_prep_minutes: Number(f.get('prep')) || null,
                p_note: String(f.get('note') ?? ''),
              })
            }}
          >
            <label htmlFor={`${base}-prep`} className="text-xs font-semibold text-muted-foreground">Ready in (minutes)</label>
            <input id={`${base}-prep`} name="prep" type="number" min={5} max={180} defaultValue={25} className={fieldClass} />
            <label htmlFor={`${base}-note`} className="text-xs font-semibold text-muted-foreground">Note to customer (optional)</label>
            <input id={`${base}-note`} name="note" maxLength={300} className={fieldClass} />
            <div className="flex gap-2">
              <Button type="submit" value="accept" className="h-11 flex-1" disabled={!!pending}>{pending === 'accept' ? <Spinner /> : 'Accept order'}</Button>
              <Button type="submit" value="decline" variant="outline" className="h-11" disabled={!!pending}>{pending === 'decline' ? <Spinner /> : 'Decline'}</Button>
            </div>
          </form>
        </Panel>
      )}

      {kitchen && ['accepted', 'preparing'].includes(status) && (
        <Panel title="Kitchen">
          <div className="flex gap-2">
            {status === 'accepted' && (
              <Button type="button" variant="outline" className="h-11 flex-1" disabled={!!pending} onClick={() => run('prep', 'advance_food_order', { p_id: id, p_status: 'preparing' })}>
                {pending === 'prep' ? <Spinner /> : 'Start preparing'}
              </Button>
            )}
            <Button type="button" className="h-11 flex-1" disabled={!!pending} onClick={() => run('ready', 'advance_food_order', { p_id: id, p_status: 'ready' })}>
              {pending === 'ready' ? <Spinner /> : 'Mark ready'}
            </Button>
          </div>
        </Panel>
      )}

      {kitchen && status === 'ready' && fulfilment === 'delivery' && (
        <Panel title="Waiting for rider">
          <p className="text-sm text-muted-foreground">Hand the bag to the CHALEGO rider assigned to this order. They confirm pickup in their app.</p>
        </Panel>
      )}

      {kitchen && status === 'ready' && fulfilment === 'pickup' && (
        <Panel title="Hand over to customer">
          <PinForm
            id={`${base}-pin`}
            busy={pending === 'pin'}
            label="Collect order"
            onSubmit={(pin) =>
              run('pin', 'complete_food_order', { p_id: id, p_pin: pin }, (ok) => {
                if (ok === false) setNotice('That PIN is not correct. Ask the customer to check their order page.')
              })
            }
          />
        </Panel>
      )}

      {viewer === 'customer' && status === 'completed' && !rated && (
        <Panel title="Rate your order">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              run('rate', 'review_food_order', { p_id: id, p_rating: rating, p_review: String(new FormData(e.currentTarget).get('review') ?? '') })
            }}
          >
            <div role="radiogroup" aria-label="Rating" className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)} className="rounded p-1">
                  <Star className={cn('size-7', n <= rating ? 'fill-accent text-accent' : 'text-muted-foreground')} aria-hidden="true" />
                </button>
              ))}
            </div>
            <label htmlFor={`${base}-review`} className="sr-only">Review</label>
            <textarea id={`${base}-review`} name="review" maxLength={1000} rows={3} placeholder="How was the food and the delivery?" className={cn(fieldClass, 'h-auto py-2')} />
            <Button type="submit" className="h-11" disabled={!!pending || rating === 0}>{pending === 'rate' ? <Spinner /> : 'Submit review'}</Button>
          </form>
        </Panel>
      )}

      {canCancel && (
        <Panel title="Cancel order">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!window.confirm('Cancel this order? This cannot be undone.')) return
              run('cancel', 'cancel_food_order', { p_id: id, p_reason: String(new FormData(e.currentTarget).get('reason') ?? '') })
            }}
          >
            <label htmlFor={`${base}-reason`} className="text-xs font-semibold text-muted-foreground">Reason{kitchen ? '' : ' (optional)'}</label>
            <input id={`${base}-reason`} name="reason" maxLength={200} required={kitchen} minLength={kitchen ? 5 : undefined} className={fieldClass} />
            <Button type="submit" variant="outline" className="h-11 border-destructive/40 text-destructive hover:bg-destructive/10" disabled={!!pending}>
              {pending === 'cancel' ? <Spinner /> : 'Cancel order'}
            </Button>
          </form>
        </Panel>
      )}
    </div>
  )
}

export function PinForm({ id, busy, label, onSubmit }: { id: string; busy: boolean; label: string; onSubmit: (pin: string) => void }) {
  const [pin, setPin] = useState('')
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(pin)
      }}
    >
      <label htmlFor={id} className="sr-only">Customer PIN</label>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        placeholder="4-digit PIN"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
        className={cn(fieldClass, 'font-mono tracking-widest')}
      />
      <Button type="submit" className="h-11 shrink-0" disabled={busy || pin.length !== 4}>
        {busy ? <Spinner /> : label}
      </Button>
    </form>
  )
}
