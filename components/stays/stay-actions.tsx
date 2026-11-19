'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { fieldClass } from '@/lib/account'
import { errorMessage } from '@/lib/rides'
import type { StayStatus } from '@/lib/stays'
import { cn } from '@/lib/utils'

type Props = {
  id: string
  status: StayStatus
  viewer: 'guest' | 'owner' | 'admin'
  checkIn: string
  checkOut: string
  today: string
  rated: boolean
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
      <h2 className="font-heading text-base font-semibold">{title}</h2>
      {children}
    </section>
  )
}

const Spinner = () => <Loader2 className="size-4 animate-spin" aria-hidden="true" />

export function StayActions({ id, status, viewer, checkIn, checkOut, today, rated }: Props) {
  const base = useId()
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [rating, setRating] = useState(0)

  async function run(key: string, fn: string, args: Record<string, unknown>) {
    setPending(key)
    setError('')
    const { error } = await createClient().rpc(fn, args)
    setPending(null)
    if (error) return setError(errorMessage(error))
    router.refresh()
  }

  const owner = viewer === 'owner'
  const canCancel =
    (viewer === 'guest' && ['requested', 'confirmed'].includes(status) && checkIn > today) ||
    (owner && status === 'confirmed') ||
    (viewer === 'admin' && ['requested', 'confirmed', 'checked_in'].includes(status))

  return (
    <div className="flex flex-col gap-4">
      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {owner && status === 'requested' && (
        <Panel title="Respond to this request">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              const accept = (e.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'accept'
              run(accept ? 'accept' : 'decline', 'respond_stay', {
                p_id: id,
                p_accept: accept,
                p_note: String(new FormData(e.currentTarget).get('note') ?? ''),
              })
            }}
          >
            <label htmlFor={`${base}-note`} className="text-xs font-semibold text-muted-foreground">Message to guest (optional)</label>
            <textarea id={`${base}-note`} name="note" maxLength={300} rows={2} className={cn(fieldClass, 'h-auto py-2')} />
            <div className="flex gap-2">
              <Button type="submit" value="accept" className="h-11 flex-1" disabled={!!pending}>{pending === 'accept' ? <Spinner /> : 'Confirm booking'}</Button>
              <Button type="submit" value="decline" variant="outline" className="h-11" disabled={!!pending}>{pending === 'decline' ? <Spinner /> : 'Decline'}</Button>
            </div>
          </form>
        </Panel>
      )}

      {owner && status === 'confirmed' && (
        <Panel title="Check the guest in">
          <p className="text-sm text-muted-foreground">
            {today < checkIn
              ? `Check-in opens on the arrival date.`
              : today >= checkOut
                ? 'The stay dates have passed. Cancel with a reason if the guest did not arrive.'
                : "Verify the guest's photo ID matches the booking name, then check them in. Cash bookings are marked paid at check-in."}
          </p>
          <Button
            type="button"
            className="h-11"
            disabled={!!pending || today < checkIn || today >= checkOut}
            onClick={() => run('checkin', 'check_in_stay', { p_id: id })}
          >
            {pending === 'checkin' ? <Spinner /> : 'Check in guest'}
          </Button>
        </Panel>
      )}

      {owner && status === 'checked_in' && (
        <Panel title="Check the guest out">
          <p className="text-sm text-muted-foreground">Completes the stay, records your earnings after commission and lets the guest leave a review.</p>
          <Button
            type="button"
            className="h-11"
            disabled={!!pending}
            onClick={() => {
              if (window.confirm('Check this guest out and complete the stay?')) run('checkout', 'complete_stay', { p_id: id })
            }}
          >
            {pending === 'checkout' ? <Spinner /> : 'Check out guest'}
          </Button>
        </Panel>
      )}

      {viewer === 'guest' && status === 'completed' && !rated && (
        <Panel title="Review your stay">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              run('rate', 'review_stay', { p_id: id, p_rating: rating, p_review: String(new FormData(e.currentTarget).get('review') ?? '') })
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
            <textarea id={`${base}-review`} name="review" maxLength={1000} rows={3} placeholder="How were the room, cleanliness and the host?" className={cn(fieldClass, 'h-auto py-2')} />
            <Button type="submit" className="h-11" disabled={!!pending || rating === 0}>{pending === 'rate' ? <Spinner /> : 'Submit review'}</Button>
          </form>
        </Panel>
      )}

      {canCancel && (
        <Panel title="Cancel booking">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!window.confirm('Cancel this booking? This cannot be undone.')) return
              run('cancel', 'cancel_stay', { p_id: id, p_reason: String(new FormData(e.currentTarget).get('reason') ?? '') })
            }}
          >
            <label htmlFor={`${base}-reason`} className="text-xs font-semibold text-muted-foreground">
              Reason{owner ? '' : ' (optional)'}
            </label>
            <input id={`${base}-reason`} name="reason" maxLength={200} required={owner} minLength={owner ? 5 : undefined} className={fieldClass} />
            <Button type="submit" variant="outline" className="h-11 border-destructive/40 text-destructive hover:bg-destructive/10" disabled={!!pending}>
              {pending === 'cancel' ? <Spinner /> : 'Cancel booking'}
            </Button>
          </form>
        </Panel>
      )}
    </div>
  )
}
