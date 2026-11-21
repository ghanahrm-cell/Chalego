'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { fieldClass } from '@/lib/account'
import { errorMessage } from '@/lib/rides'
import type { StayKind, StayUnit } from '@/lib/stays'
import { cn } from '@/lib/utils'

const NUMBER_FIELDS = [
  ['max_guests', 'Max guests', 1, 30, 2],
  ['bedrooms', 'Bedrooms', 0, 20, 1],
  ['beds', 'Beds', 1, 40, 1],
  ['bathrooms', 'Bathrooms', 0, 20, 1],
  ['min_nights', 'Minimum nights', 1, 90, 1],
] as const

export function UnitForm({
  propertyId,
  kind,
  currency,
  unit,
  onDone,
}: {
  propertyId: string
  kind: StayKind
  currency: string
  unit?: StayUnit
  onDone?: () => void
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function submit(form: HTMLFormElement) {
    const f = new FormData(form)
    const get = (k: string) => String(f.get(k) ?? '')
    setPending(true)
    setError('')
    const { error } = await createClient().rpc('save_stay_unit', {
      p_id: unit?.id ?? null,
      p_property: propertyId,
      p: {
        name: get('name'),
        description: get('description'),
        nightly_rate: get('nightly_rate'),
        cleaning_fee: get('cleaning_fee'),
        weekly_discount_pct: get('weekly_discount_pct'),
        monthly_discount_pct: get('monthly_discount_pct'),
        quantity: kind === 'hotel' ? get('quantity') : '1',
        ...Object.fromEntries(NUMBER_FIELDS.map(([k]) => [k, get(k)])),
        is_active: f.get('is_active') === 'on',
      },
    })
    setPending(false)
    if (error) return setError(errorMessage(error, 'Could not save the room.'))
    if (!unit) form.reset()
    router.refresh()
    onDone?.()
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit(e.currentTarget)
      }}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <Field label={kind === 'hotel' ? 'Room type name' : 'Unit name'} className="sm:col-span-2">
        <input name="name" required minLength={2} maxLength={80} defaultValue={unit?.name} placeholder={kind === 'hotel' ? 'Deluxe King Room' : '2-Bed Apartment'} className={fieldClass} />
      </Field>
      <Field label={`Nightly rate (${currency})`}>
        <input name="nightly_rate" type="number" required min={1} step="0.01" defaultValue={unit?.nightly_rate} className={fieldClass} />
      </Field>
      <Field label={`Cleaning fee (${currency})`}>
        <input name="cleaning_fee" type="number" min={0} step="0.01" defaultValue={unit?.cleaning_fee ?? 0} className={fieldClass} />
      </Field>
      {NUMBER_FIELDS.map(([k, label, min, max, def]) => (
        <Field key={k} label={label}>
          <input name={k} type="number" required min={min} max={max} defaultValue={unit?.[k] ?? def} className={fieldClass} />
        </Field>
      ))}
      {kind === 'hotel' && (
        <Field label="Rooms of this type">
          <input name="quantity" type="number" required min={1} max={500} defaultValue={unit?.quantity ?? 1} className={fieldClass} />
        </Field>
      )}
      <Field label="Weekly discount %">
        <input name="weekly_discount_pct" type="number" min={0} max={50} step="0.5" defaultValue={unit?.weekly_discount_pct ?? 0} className={fieldClass} />
      </Field>
      <Field label="Monthly discount %">
        <input name="monthly_discount_pct" type="number" min={0} max={70} step="0.5" defaultValue={unit?.monthly_discount_pct ?? 0} className={fieldClass} />
      </Field>
      <Field label="Description (optional)" className="sm:col-span-2 lg:col-span-4">
        <textarea name="description" maxLength={1000} rows={2} defaultValue={unit?.description ?? ''} className={cn(fieldClass, 'h-auto py-2')} />
      </Field>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="is_active" defaultChecked={unit?.is_active ?? true} className="size-4 accent-primary" />
        Open for booking
      </label>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2 lg:col-span-4">{error}</p>}
      <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
        <Button type="submit" className="h-11" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : unit ? 'Save room' : kind === 'hotel' ? 'Add room type' : 'Add unit'}
        </Button>
        {onDone && <Button type="button" variant="outline" className="h-11" onClick={onDone}>Cancel</Button>}
      </div>
    </form>
  )
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactElement }) {
  return (
    <label className={cn('flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground', className)}>
      {label}
      {children}
    </label>
  )
}
