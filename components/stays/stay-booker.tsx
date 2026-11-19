'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { fieldClass, formatMoney, type PaymentMethod } from '@/lib/account'
import { errorMessage } from '@/lib/rides'
import { addDays, isIsoDate, nightsLabel, type StayQuote } from '@/lib/stays'
import { cn } from '@/lib/utils'

type BookerUnit = { id: string; name: string; max_guests: number; nightly_rate: number; min_nights: number }

async function fetchQuote([, unit, checkIn, checkOut, guests]: [string, string, string, string, number]) {
  const { data, error } = await createClient().rpc('stay_quote', { p_unit: unit, p_in: checkIn, p_out: checkOut, p_guests: guests })
  if (error) throw new Error(errorMessage(error, 'Could not price these dates.'))
  return data as StayQuote
}

export function StayBooker({
  units,
  currency,
  locale,
  methods,
  checkInTime,
  initialUnit,
  initialIn,
  initialOut,
  initialGuests,
}: {
  units: BookerUnit[]
  currency: string
  locale: string
  methods: PaymentMethod[]
  checkInTime: string
  initialUnit?: string
  initialIn?: string
  initialOut?: string
  initialGuests?: number
}) {
  const router = useRouter()
  const base = useId()
  const today = new Date().toISOString().slice(0, 10)
  const [unitId, setUnitId] = useState(units.find((u) => u.id === initialUnit)?.id ?? units[0]?.id ?? '')
  const unit = units.find((u) => u.id === unitId)
  const [checkIn, setCheckIn] = useState(isIsoDate(initialIn) && initialIn >= today ? initialIn : addDays(today, 1))
  const [checkOut, setCheckOut] = useState(() =>
    isIsoDate(initialOut) && initialOut > checkIn ? initialOut : addDays(checkIn, Math.max(unit?.min_nights ?? 1, 1)),
  )
  const [guests, setGuests] = useState(Math.min(Math.max(initialGuests ?? 1, 1), unit?.max_guests ?? 1))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const valid = Boolean(unitId && isIsoDate(checkIn) && isIsoDate(checkOut) && checkOut > checkIn && guests >= 1)
  const { data: quote, error: quoteError, isLoading } = useSWR(
    valid ? (['stay-quote', unitId, checkIn, checkOut, guests] as [string, string, string, string, number]) : null,
    fetchQuote,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  const money = (n: number) => formatMoney(Number(n), currency, locale)
  const bookable = Boolean(quote && !quote.error)

  async function submit(form: FormData) {
    setPending(true)
    setError('')
    const { data, error } = await createClient().rpc('request_stay', {
      p_unit: unitId,
      p_in: checkIn,
      p_out: checkOut,
      p_guests: guests,
      p_payment_method: String(form.get('payment') ?? ''),
      p_note: String(form.get('note') ?? ''),
    })
    if (error || !data) {
      setPending(false)
      return setError(errorMessage(error, 'Could not send your booking request. Please try again.'))
    }
    router.push(`/account/stays/${data}`)
  }

  const label = (name: string, text: string) => (
    <label htmlFor={`${base}-${name}`} className="text-xs font-semibold text-muted-foreground">{text}</label>
  )

  if (units.length === 0) {
    return <p className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">No rooms are open for booking right now.</p>
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (bookable) submit(new FormData(e.currentTarget))
      }}
      className="flex flex-col gap-4 rounded-2xl border bg-card p-5"
      aria-label="Book this stay"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold">Reserve</h2>
        {unit && (
          <p className="text-sm">
            <span className="font-heading text-xl font-bold">{money(unit.nightly_rate)}</span>
            <span className="text-muted-foreground"> /night</span>
          </p>
        )}
      </div>

      {units.length > 1 && (
        <div className="flex flex-col gap-1.5">
          {label('unit', 'Room or unit')}
          <select
            id={`${base}-unit`}
            value={unitId}
            onChange={(e) => {
              setUnitId(e.target.value)
              const next = units.find((u) => u.id === e.target.value)
              if (next && guests > next.max_guests) setGuests(next.max_guests)
            }}
            className={fieldClass}
          >
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.name} · {money(u.nightly_rate)}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          {label('in', 'Check-in')}
          <input
            id={`${base}-in`}
            type="date"
            required
            min={today}
            value={checkIn}
            onChange={(e) => {
              const v = e.target.value
              setCheckIn(v)
              if (isIsoDate(v) && checkOut <= v) setCheckOut(addDays(v, Math.max(unit?.min_nights ?? 1, 1)))
            }}
            className={cn(fieldClass, 'px-2')}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          {label('out', 'Check-out')}
          <input
            id={`${base}-out`}
            type="date"
            required
            min={isIsoDate(checkIn) ? addDays(checkIn, 1) : today}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className={cn(fieldClass, 'px-2')}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {label('guests', `Guests (max ${unit?.max_guests ?? 1})`)}
        <input
          id={`${base}-guests`}
          type="number"
          min={1}
          max={unit?.max_guests ?? 1}
          required
          value={guests}
          onChange={(e) => setGuests(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
          className={fieldClass}
        />
      </div>

      <div aria-live="polite" className="rounded-xl bg-muted/60 p-4 text-sm">
        {!valid ? (
          <p className="text-muted-foreground">Choose a check-out date after check-in.</p>
        ) : isLoading ? (
          <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Checking availability…</p>
        ) : quoteError ? (
          <p className="text-destructive">{quoteError.message}</p>
        ) : quote ? (
          <div className="flex flex-col gap-3">
            {quote.error && <p className="font-medium text-destructive">{quote.error}</p>}
            <dl className="flex flex-col gap-1.5">
              <Row k={`${money(quote.nightly_rate)} × ${nightsLabel(quote.nights)}`} v={money(quote.subtotal)} />
              {quote.discount > 0 && <Row k={quote.nights >= 28 ? 'Monthly discount' : 'Weekly discount'} v={`−${money(quote.discount)}`} />}
              {quote.cleaning_fee > 0 && <Row k="Cleaning fee" v={money(quote.cleaning_fee)} />}
              {quote.tax > 0 && <Row k={`Tax (${quote.tax_rate}%)`} v={money(quote.tax)} />}
              <Row k="Total" v={money(quote.total)} strong />
            </dl>
            {!quote.error && quote.available > 0 && quote.available <= 2 && (
              <p className="text-xs font-medium text-accent-foreground">Only {quote.available} left for these dates</p>
            )}
          </div>
        ) : null}
      </div>

      {bookable && (
        <>
          <div className="flex flex-col gap-1.5">
            {label('payment', 'Payment method')}
            <select id={`${base}-payment`} name="payment" required className={fieldClass}>
              {methods.map((m) => <option key={m.id} value={m.provider}>{m.display_name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            {label('note', 'Message to host (optional)')}
            <textarea id={`${base}-note`} name="note" maxLength={300} rows={2} placeholder={`Arrival time (check-in from ${checkInTime}), special requests…`} className={cn(fieldClass, 'h-auto py-2')} />
          </div>
        </>
      )}

      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Button type="submit" className="h-11" disabled={pending || !bookable || methods.length === 0}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : 'Request to book'}
      </Button>
      <p className="text-xs text-muted-foreground">You won&apos;t be charged until the host confirms. Free cancellation until the day before check-in.</p>
    </form>
  )
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={cn('flex justify-between gap-3', strong && 'border-t pt-1.5 font-heading text-base font-semibold')}>
      <dt className={strong ? undefined : 'text-muted-foreground'}>{k}</dt>
      <dd>{v}</dd>
    </div>
  )
}
