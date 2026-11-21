'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PhotoUploader } from '@/components/rentals/photo-uploader'
import { createClient } from '@/lib/supabase/client'
import { fieldClass, formatMoney } from '@/lib/account'
import { errorMessage } from '@/lib/rides'
import { FUEL_LEVELS, type RentalStatus } from '@/lib/rentals'
import { cn } from '@/lib/utils'

type Booking = {
  id: string
  status: RentalStatus
  viewer: 'renter' | 'owner' | 'admin'
  start_at: string
  returned_at: string | null
  rating: number | null
  deposit_amount: number
  pickup_odometer: number | null
  currency: string
  id_type: string
  id_number: string
  license_number: string | null
  drive_option: string
}

function useRpc() {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState('')
  async function run(key: string, fn: string, args: Record<string, unknown>) {
    setPending(key)
    setError('')
    const { error } = await createClient().rpc(fn, args)
    setPending(null)
    if (error) {
      setError(errorMessage(error))
      return false
    }
    router.refresh()
    return true
  }
  return { pending, error, run }
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
      <h2 className="font-heading text-base font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Spinner() {
  return <Loader2 className="size-4 animate-spin" aria-hidden="true" />
}

export function BookingActions({ b, userId, locale }: { b: Booking; userId: string; locale: string }) {
  const base = useId()
  const { pending, error, run } = useRpc()
  const [rating, setRating] = useState(0)
  const [handoverVerified, setHandoverVerified] = useState(false)
  const upcoming = new Date(b.start_at).getTime() > Date.now()
  const canCancel =
    (b.viewer === 'renter' && ['requested', 'confirmed'].includes(b.status) && upcoming) ||
    (b.viewer === 'owner' && b.status === 'confirmed') ||
    (b.viewer === 'admin' && ['requested', 'confirmed', 'active'].includes(b.status))
  const manager = b.viewer === 'owner'

  return (
    <div className="flex flex-col gap-4">
      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {manager && b.status === 'requested' && (
        <Panel title="Respond to this request">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              const accept = (e.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'accept'
              const note = String(new FormData(e.currentTarget).get('note') ?? '')
              run(accept ? 'accept' : 'decline', 'respond_rental', { p_id: b.id, p_accept: accept, p_note: note })
            }}
          >
            <label htmlFor={`${base}-rnote`} className="text-xs font-semibold text-muted-foreground">Message to renter (optional)</label>
            <textarea id={`${base}-rnote`} name="note" maxLength={300} rows={2} className={cn(fieldClass, 'h-auto py-2')} />
            <div className="flex gap-2">
              <Button type="submit" value="accept" className="h-11 flex-1" disabled={!!pending}>{pending === 'accept' ? <Spinner /> : 'Confirm booking'}</Button>
              <Button type="submit" value="decline" variant="outline" className="h-11" disabled={!!pending}>{pending === 'decline' ? <Spinner /> : 'Decline'}</Button>
            </div>
          </form>
        </Panel>
      )}

      {manager && b.status === 'confirmed' && (
        <Panel title="Hand over the vehicle">
          <div className="rounded-lg bg-muted px-3 py-2 text-sm">
            Check the renter&apos;s original {b.id_type.replace(/_/g, ' ')} <strong>{b.id_number}</strong>
            {b.drive_option === 'self_drive' && b.license_number ? <> and driving licence <strong>{b.license_number}</strong></> : null}.
          </div>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              const f = new FormData(e.currentTarget)
              run('start', 'start_rental', {
                p_id: b.id,
                p_odometer: Number(f.get('odometer')),
                p_fuel: String(f.get('fuel')),
                p_notes: String(f.get('notes') ?? ''),
                p_id_verified: handoverVerified,
              })
            }}
          >
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
              Odometer (km)
              <input name="odometer" type="number" min={0} max={9999999} required className={fieldClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
              Fuel level
              <select name="fuel" defaultValue="full" className={fieldClass}>
                {FUEL_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground sm:col-span-2">
              Condition notes
              <textarea name="notes" maxLength={500} rows={2} className={cn(fieldClass, 'h-auto py-2')} placeholder="Existing scratches, accessories handed over…" />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={handoverVerified} onChange={(e) => setHandoverVerified(e.target.checked)} className="size-4 accent-primary" />
              I have verified the renter&apos;s ID in person
            </label>
            <Button type="submit" className="h-11 sm:col-span-2" disabled={!!pending || !handoverVerified}>{pending === 'start' ? <Spinner /> : 'Start rental'}</Button>
          </form>
        </Panel>
      )}

      {manager && b.status === 'active' && (
        <Panel title="Record the return">
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              const f = new FormData(e.currentTarget)
              run('complete', 'complete_rental', {
                p_id: b.id,
                p_odometer: Number(f.get('odometer')),
                p_fuel: String(f.get('fuel')),
                p_notes: String(f.get('notes') ?? ''),
                p_deposit_refund: Number(f.get('refund')),
              })
            }}
          >
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
              Return odometer (km)
              <input name="odometer" type="number" min={b.pickup_odometer ?? 0} max={9999999} required className={fieldClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
              Fuel level
              <select name="fuel" defaultValue="full" className={fieldClass}>
                {FUEL_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground sm:col-span-2">
              Deposit to refund (held {formatMoney(Number(b.deposit_amount), b.currency, locale)})
              <input name="refund" type="number" min={0} max={b.deposit_amount} step="0.01" defaultValue={b.deposit_amount} required className={fieldClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground sm:col-span-2">
              Return notes (required if deducting from the deposit)
              <textarea name="notes" maxLength={500} rows={2} className={cn(fieldClass, 'h-auto py-2')} />
            </label>
            <Button type="submit" className="h-11 sm:col-span-2" disabled={!!pending}>{pending === 'complete' ? <Spinner /> : 'Complete rental'}</Button>
          </form>
        </Panel>
      )}

      {b.viewer === 'renter' && b.status === 'completed' && b.rating == null && (
        <Panel title="Rate your rental">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              run('rate', 'rate_rental', { p_id: b.id, p_rating: rating, p_review: String(new FormData(e.currentTarget).get('review') ?? '') })
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
            <textarea id={`${base}-review`} name="review" maxLength={500} rows={3} placeholder="How was the vehicle and the owner?" className={cn(fieldClass, 'h-auto py-2')} />
            <Button type="submit" className="h-11" disabled={!!pending || rating === 0}>{pending === 'rate' ? <Spinner /> : 'Submit rating'}</Button>
          </form>
        </Panel>
      )}

      {b.viewer !== 'admin' &&
        (['confirmed', 'active'].includes(b.status) ||
          (b.status === 'completed' && b.returned_at && Date.now() - new Date(b.returned_at).getTime() < 7 * 86400_000)) && (
          <DamageForm bookingId={b.id} userId={userId} run={run} pending={pending === 'damage'} />
        )}

      {canCancel && (
        <Panel title="Cancel booking">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!window.confirm('Cancel this booking? This cannot be undone.')) return
              run('cancel', 'cancel_rental', { p_id: b.id, p_reason: String(new FormData(e.currentTarget).get('reason') ?? '') })
            }}
          >
            <label htmlFor={`${base}-reason`} className="text-xs font-semibold text-muted-foreground">
              Reason{b.viewer === 'owner' ? '' : ' (optional)'}
            </label>
            <input id={`${base}-reason`} name="reason" maxLength={200} required={b.viewer === 'owner'} minLength={b.viewer === 'owner' ? 5 : undefined} className={fieldClass} />
            <Button type="submit" variant="outline" className="h-11 border-destructive/40 text-destructive hover:bg-destructive/10" disabled={!!pending}>
              {pending === 'cancel' ? <Spinner /> : 'Cancel booking'}
            </Button>
          </form>
        </Panel>
      )}
    </div>
  )
}

function DamageForm({
  bookingId,
  userId,
  run,
  pending,
}: {
  bookingId: string
  userId: string
  run: (key: string, fn: string, args: Record<string, unknown>) => Promise<boolean>
  pending: boolean
}) {
  const [open, setOpen] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  if (!open) {
    return (
      <Button type="button" variant="outline" className="h-11" onClick={() => setOpen(true)}>Report damage</Button>
    )
  }
  return (
    <Panel title="Report damage">
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault()
          const form = e.currentTarget
          const f = new FormData(form)
          const cost = String(f.get('cost') ?? '')
          const ok = await run('damage', 'report_rental_damage', {
            p_booking_id: bookingId,
            p_stage: String(f.get('stage')),
            p_severity: String(f.get('severity')),
            p_description: String(f.get('description') ?? ''),
            p_estimated_cost: cost ? Number(cost) : null,
            p_photos: photos,
          })
          if (ok) {
            form.reset()
            setPhotos([])
            setOpen(false)
          }
        }}
      >
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
          When was it found?
          <select name="stage" className={fieldClass} defaultValue="pickup">
            <option value="pickup">At pickup</option>
            <option value="during">During the rental</option>
            <option value="return">At return</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
          Severity
          <select name="severity" className={fieldClass} defaultValue="minor">
            <option value="minor">Minor</option>
            <option value="moderate">Moderate</option>
            <option value="major">Major</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground sm:col-span-2">
          Description
          <textarea name="description" required minLength={10} maxLength={1000} rows={3} className={cn(fieldClass, 'h-auto py-2')} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground sm:col-span-2">
          Estimated repair cost (optional)
          <input name="cost" type="number" min={0} step="0.01" className={fieldClass} />
        </label>
        <div className="sm:col-span-2">
          <PhotoUploader userId={userId} value={photos} onChange={setPhotos} max={6} label="Damage photos" />
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" className="h-11 flex-1" disabled={pending}>{pending ? <Spinner /> : 'Submit report'}</Button>
          <Button type="button" variant="outline" className="h-11" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </form>
    </Panel>
  )
}
