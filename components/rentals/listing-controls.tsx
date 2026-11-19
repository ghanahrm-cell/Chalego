'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { fieldClass } from '@/lib/account'
import { errorMessage, toLocalInputValue } from '@/lib/rides'
import { formatRange } from '@/lib/rentals'

type Blackout = { id: string; start_at: string; end_at: string; reason: string | null }

export function ListingControls({
  vehicleId,
  status,
  blackouts,
  locale,
}: {
  vehicleId: string
  status: string
  blackouts: Blackout[]
  locale: string
}) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function run(key: string, fn: string, args: Record<string, unknown>) {
    setPending(key)
    setError('')
    const { error } = await createClient().rpc(fn, args)
    setPending(null)
    if (error) return setError(errorMessage(error)), false
    router.refresh()
    return true
  }

  const now = toLocalInputValue(new Date())

  return (
    <div className="flex flex-col gap-4">
      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {(status === 'active' || status === 'paused') && (
        <section className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
          <h2 className="font-heading text-base font-semibold">Visibility</h2>
          <p className="text-sm text-muted-foreground">
            {status === 'active' ? 'Your listing is live and bookable.' : 'Your listing is hidden from search.'}
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={!!pending}
            onClick={() => run('status', 'set_rental_vehicle_status', { p_id: vehicleId, p_status: status === 'active' ? 'paused' : 'active' })}
          >
            {pending === 'status' ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : status === 'active' ? 'Pause listing' : 'Resume listing'}
          </Button>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
        <h2 className="font-heading text-base font-semibold">Block dates</h2>
        <p className="text-sm text-muted-foreground">Block days for servicing or personal use so renters can&apos;t book them.</p>
        <form
          className="flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault()
            const form = e.currentTarget
            const f = new FormData(form)
            const ok = await run('add', 'add_rental_blackout', {
              p_vehicle_id: vehicleId,
              p_start: new Date(String(f.get('start'))).toISOString(),
              p_end: new Date(String(f.get('end'))).toISOString(),
              p_reason: String(f.get('reason') ?? ''),
            })
            if (ok) form.reset()
          }}
        >
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
            From
            <input name="start" type="datetime-local" required min={now} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
            Until
            <input name="end" type="datetime-local" required min={now} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
            Reason (optional)
            <input name="reason" maxLength={120} className={fieldClass} placeholder="Servicing" />
          </label>
          <Button type="submit" className="h-11" disabled={!!pending}>
            {pending === 'add' ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : 'Block these dates'}
          </Button>
        </form>
        {blackouts.length > 0 && (
          <ul className="flex flex-col gap-2 border-t pt-3">
            {blackouts.map((x) => (
              <li key={x.id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {formatRange(x.start_at, x.end_at, locale)}
                  {x.reason && <span className="text-muted-foreground"> · {x.reason}</span>}
                </span>
                <button
                  type="button"
                  onClick={() => run(`rm-${x.id}`, 'remove_rental_blackout', { p_id: x.id })}
                  disabled={!!pending}
                  className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                  aria-label="Remove blocked dates"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
