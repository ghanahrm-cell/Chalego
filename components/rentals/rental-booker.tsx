'use client'

import { useId, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { fieldClass, formatMoney, type PaymentMethod } from '@/lib/account'
import { errorMessage, toLocalInputValue } from '@/lib/rides'
import { AGREEMENT_V1, ID_TYPES, type DriveOptions, type RentalQuote } from '@/lib/rentals'
import { cn } from '@/lib/utils'

type BookerVehicle = {
  id: string
  kind: 'vehicle' | 'truck'
  country_code: string
  currency: string
  drive_options: DriveOptions
  delivery_available: boolean
  min_hours: number
  hourly: boolean
}

function initialRange(start: string | undefined, end: string | undefined, minHours: number) {
  const s = start && /^\d{4}-\d{2}-\d{2}$/.test(start) ? new Date(`${start}T09:00`) : null
  const base = s && s.getTime() > Date.now() + 3600_000 ? s : (() => {
    const d = new Date(Date.now() + 86400_000)
    d.setHours(9, 0, 0, 0)
    return d
  })()
  const e = end && /^\d{4}-\d{2}-\d{2}$/.test(end) ? new Date(`${end}T09:00`) : null
  const ret = e && e > base ? e : new Date(base.getTime() + Math.max(minHours, 24) * 3600_000)
  return [toLocalInputValue(base), toLocalInputValue(ret)] as const
}

async function fetchQuote([, id, start, end, drive, delivery]: [string, string, string, string, string, boolean]) {
  const { data, error } = await createClient().rpc('rental_quote', {
    p_vehicle_id: id,
    p_start: start,
    p_end: end,
    p_drive: drive,
    p_delivery: delivery,
  })
  if (error) throw new Error(errorMessage(error, 'Could not price these dates.'))
  return data as RentalQuote
}

export function RentalBooker({
  vehicle,
  locale,
  methods,
  defaultName,
  initialStart,
  initialEnd,
}: {
  vehicle: BookerVehicle
  locale: string
  methods: PaymentMethod[]
  defaultName: string
  initialStart?: string
  initialEnd?: string
}) {
  const router = useRouter()
  const base = useId()
  const [defaults] = useState(() => initialRange(initialStart, initialEnd, vehicle.min_hours))
  const [start, setStart] = useState(defaults[0])
  const [end, setEnd] = useState(defaults[1])
  const [drive, setDrive] = useState<'self_drive' | 'with_driver'>(vehicle.drive_options === 'with_driver' ? 'with_driver' : 'self_drive')
  const [delivery, setDelivery] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const startIso = useMemo(() => (start ? new Date(start).toISOString() : ''), [start])
  const endIso = useMemo(() => (end ? new Date(end).toISOString() : ''), [end])
  const { data: quote, error: quoteError, isLoading } = useSWR(
    startIso && endIso ? (['rental-quote', vehicle.id, startIso, endIso, drive, delivery] as [string, string, string, string, string, boolean]) : null,
    fetchQuote,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  const money = (n: number) => formatMoney(Number(n), vehicle.currency, locale)
  const minStart = toLocalInputValue(new Date(Date.now() + 3600_000))

  async function submit(form: FormData) {
    setPending(true)
    setError('')
    const { data, error } = await createClient().rpc('request_rental', {
      p_vehicle_id: vehicle.id,
      p_start: startIso,
      p_end: endIso,
      p_drive: drive,
      p_delivery: delivery,
      p_delivery_address: String(form.get('delivery_address') ?? ''),
      p_payment_method: String(form.get('payment') ?? ''),
      p_id_type: String(form.get('id_type') ?? ''),
      p_id_number: String(form.get('id_number') ?? ''),
      p_license: String(form.get('license') ?? ''),
      p_agreement_name: String(form.get('agreement_name') ?? ''),
      p_agree: form.get('agree') === 'on',
      p_note: String(form.get('note') ?? ''),
    })
    if (error || !data) {
      setPending(false)
      return setError(errorMessage(error, 'Could not send your booking request. Please try again.'))
    }
    router.push(`/account/rentals/${data}`)
  }

  const label = (name: string, text: string) => (
    <label htmlFor={`${base}-${name}`} className="text-xs font-semibold text-muted-foreground">{text}</label>
  )

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (step === 1) return quote && setStep(2)
        submit(new FormData(e.currentTarget))
      }}
      className="flex flex-col gap-4 rounded-2xl border bg-card p-5"
      aria-label="Book this rental"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">{step === 1 ? 'Choose your dates' : 'Confirm and sign'}</h2>
        <span className="text-xs text-muted-foreground">Step {step} of 2</span>
      </div>

      <fieldset disabled={step === 2} className="flex flex-col gap-4 disabled:opacity-70">
        <legend className="sr-only">Dates and options</legend>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            {label('start', 'Pickup')}
            <input id={`${base}-start`} type="datetime-local" required min={minStart} value={start} onChange={(e) => setStart(e.target.value)} className={cn(fieldClass, 'px-2 text-xs')} />
          </div>
          <div className="flex flex-col gap-1.5">
            {label('end', 'Return')}
            <input id={`${base}-end`} type="datetime-local" required min={start} value={end} onChange={(e) => setEnd(e.target.value)} className={cn(fieldClass, 'px-2 text-xs')} />
          </div>
        </div>
        {vehicle.drive_options === 'both' ? (
          <div role="radiogroup" aria-label="Drive option" className="grid grid-cols-2 gap-2">
            {(['self_drive', 'with_driver'] as const).map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={drive === d}
                onClick={() => setDrive(d)}
                className={cn('h-11 rounded-lg border text-sm font-medium', drive === d ? 'border-primary bg-primary/10 text-primary' : 'hover:border-foreground/30')}
              >
                {d === 'self_drive' ? 'Self-drive' : 'With driver'}
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm">{drive === 'self_drive' ? 'Self-drive only' : 'Driver included with this rental'}</p>
        )}
        {vehicle.delivery_available && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={delivery} onChange={(e) => setDelivery(e.target.checked)} className="size-4 accent-primary" />
            Deliver to my address
          </label>
        )}
      </fieldset>

      <div aria-live="polite" className="rounded-xl bg-muted/60 p-4 text-sm">
        {isLoading ? (
          <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Pricing your dates…</p>
        ) : quoteError ? (
          <p className="text-destructive">{quoteError.message}</p>
        ) : quote ? (
          <dl className="flex flex-col gap-1.5">
            <Row k={`Rental (${quote.label})`} v={money(quote.base)} />
            {quote.driver_fee > 0 && <Row k="Driver" v={money(quote.driver_fee)} />}
            {quote.delivery_fee > 0 && <Row k="Delivery" v={money(quote.delivery_fee)} />}
            {quote.tax > 0 && <Row k={`Tax (${quote.tax_rate}%)`} v={money(quote.tax)} />}
            <Row k="Total" v={money(quote.total)} strong />
            {quote.deposit > 0 && <Row k="Refundable deposit" v={money(quote.deposit)} />}
          </dl>
        ) : null}
      </div>

      {step === 2 && (
        <div className="flex flex-col gap-4">
          {delivery && (
            <div className="flex flex-col gap-1.5">
              {label('delivery_address', 'Delivery address')}
              <input id={`${base}-delivery_address`} name="delivery_address" required minLength={5} maxLength={200} className={fieldClass} />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              {label('id_type', 'ID type')}
              <select id={`${base}-id_type`} name="id_type" className={fieldClass} defaultValue="national_id">
                {ID_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              {label('id_number', 'ID number')}
              <input id={`${base}-id_number`} name="id_number" required minLength={4} maxLength={40} autoComplete="off" className={fieldClass} />
            </div>
          </div>
          {drive === 'self_drive' && (
            <div className="flex flex-col gap-1.5">
              {label('license', 'Driving licence number')}
              <input id={`${base}-license`} name="license" required minLength={4} maxLength={40} autoComplete="off" className={fieldClass} />
            </div>
          )}
          <p className="-mt-2 text-xs text-muted-foreground">The owner checks your original ID at pickup. Only the last 4 digits are shown back to you.</p>
          <div className="flex flex-col gap-1.5">
            {label('payment', 'Payment method')}
            <select id={`${base}-payment`} name="payment" required className={fieldClass}>
              {methods.map((m) => <option key={m.id} value={m.provider}>{m.display_name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            {label('note', 'Note to owner (optional)')}
            <textarea id={`${base}-note`} name="note" maxLength={300} rows={2} className={cn(fieldClass, 'h-auto py-2')} />
          </div>
          <details className="rounded-lg border p-3 text-sm" open>
            <summary className="cursor-pointer font-semibold">Rental agreement (v1)</summary>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-muted-foreground">
              {AGREEMENT_V1.map((t) => <li key={t}>{t}</li>)}
            </ol>
          </details>
          <div className="flex flex-col gap-1.5">
            {label('agreement_name', 'Type your full legal name to sign')}
            <input id={`${base}-agreement_name`} name="agreement_name" required minLength={3} maxLength={120} defaultValue={defaultName} className={fieldClass} />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="agree" required className="mt-0.5 size-4 accent-primary" />
            I have read and accept the rental agreement and the deposit terms.
          </label>
        </div>
      )}

      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        {step === 2 && (
          <Button type="button" variant="outline" className="h-11" onClick={() => setStep(1)} disabled={pending}>Back</Button>
        )}
        <Button type="submit" className="h-11 flex-1" disabled={pending || !quote || (step === 2 && methods.length === 0)}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : step === 1 ? 'Continue' : 'Send booking request'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">You will not be charged until the owner confirms. Free cancellation until pickup.</p>
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
