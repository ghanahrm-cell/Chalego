'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PhotoUploader } from '@/components/rentals/photo-uploader'
import { createClient } from '@/lib/supabase/client'
import { fieldClass } from '@/lib/account'
import { errorMessage } from '@/lib/rides'
import { STAY_AMENITIES, STAY_COUNTRIES, type StayKind, type StayProperty } from '@/lib/stays'
import { cn } from '@/lib/utils'

export function PropertyForm({ property, userId, isAdmin }: { property?: StayProperty; userId: string; isAdmin: boolean }) {
  const router = useRouter()
  const [kind, setKind] = useState<StayKind>(property?.kind ?? 'hotel')
  const [photos, setPhotos] = useState<string[]>(property?.photos ?? [])
  const [amenities, setAmenities] = useState<string[]>(property?.amenities ?? [])
  const [asChalego, setAsChalego] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function submit(form: FormData) {
    setPending(true)
    setError('')
    setSaved(false)
    const get = (k: string) => String(form.get(k) ?? '')
    const { data, error } = await createClient().rpc('save_stay_property', {
      p_id: property?.id ?? null,
      p: {
        kind,
        title: get('title'),
        description: get('description'),
        city: get('city'),
        address: get('address'),
        star_rating: kind === 'hotel' ? get('star_rating') : '',
        amenities,
        house_rules: get('house_rules'),
        check_in_time: get('check_in_time'),
        check_out_time: get('check_out_time'),
        photos,
        is_active: form.get('is_active') === 'on',
        ...(asChalego ? { as_chalego: true, country_code: get('country_code') } : {}),
      },
    })
    setPending(false)
    if (error || !data) return setError(errorMessage(error, 'Could not save the property.'))
    if (property) {
      setSaved(true)
      router.refresh()
    } else {
      router.push(`/partner/stays/${data}`)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit(new FormData(e.currentTarget))
      }}
      className="flex flex-col gap-5 rounded-2xl border bg-card p-5"
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-semibold text-muted-foreground">Property type</legend>
        <div role="radiogroup" aria-label="Property type" className="grid grid-cols-2 gap-2 sm:max-w-sm">
          {(['hotel', 'apartment'] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => setKind(k)}
              className={cn('h-11 rounded-lg border text-sm font-medium', kind === k ? 'border-primary bg-primary/10 text-primary' : 'hover:border-foreground/30')}
            >
              {k === 'hotel' ? 'Hotel or guesthouse' : 'Apartment or home'}
            </button>
          ))}
        </div>
      </fieldset>

      {isAdmin && !property && (
        <div className="flex flex-col gap-3 rounded-lg bg-muted/60 p-3 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={asChalego} onChange={(e) => setAsChalego(e.target.checked)} className="size-4 accent-primary" />
            List as CHALEGO Stays (company-owned)
          </label>
          {asChalego && (
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              Country
              <select name="country_code" defaultValue="GH" className={cn(fieldClass, 'w-auto')}>
                {Object.entries(STAY_COUNTRIES).map(([code, c]) => <option key={code} value={code}>{c.name}</option>)}
              </select>
            </label>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Property name" className="sm:col-span-2">
          <input name="title" required minLength={3} maxLength={120} defaultValue={property?.title} className={fieldClass} />
        </Field>
        <Field label="City">
          <input name="city" required minLength={2} maxLength={80} defaultValue={property?.city} className={fieldClass} />
        </Field>
        <Field label="Street address or area">
          <input name="address" required minLength={4} maxLength={200} defaultValue={property?.address} className={fieldClass} />
        </Field>
        {kind === 'hotel' && (
          <Field label="Star rating">
            <select name="star_rating" defaultValue={property?.star_rating ?? ''} className={fieldClass}>
              <option value="">Not rated</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
            </select>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Check-in from">
            <input name="check_in_time" type="time" required defaultValue={property?.check_in_time ?? '14:00'} className={fieldClass} />
          </Field>
          <Field label="Check-out by">
            <input name="check_out_time" type="time" required defaultValue={property?.check_out_time ?? '11:00'} className={fieldClass} />
          </Field>
        </div>
        <Field label="Description" className="sm:col-span-2">
          <textarea name="description" maxLength={3000} rows={4} defaultValue={property?.description ?? ''} className={cn(fieldClass, 'h-auto py-2')} />
        </Field>
        <Field label="House rules (optional)" className="sm:col-span-2">
          <textarea name="house_rules" maxLength={1500} rows={3} defaultValue={property?.house_rules ?? ''} placeholder="No smoking, quiet hours after 22:00, no parties…" className={cn(fieldClass, 'h-auto py-2')} />
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-semibold text-muted-foreground">Amenities</legend>
        <div className="flex flex-wrap gap-2">
          {STAY_AMENITIES.map((a) => {
            const on = amenities.includes(a)
            return (
              <button
                key={a}
                type="button"
                aria-pressed={on}
                onClick={() => setAmenities(on ? amenities.filter((x) => x !== a) : [...amenities, a])}
                className={cn('rounded-full border px-3 py-1.5 text-sm', on ? 'border-primary bg-primary/10 text-primary' : 'hover:border-foreground/30')}
              >
                {a}
              </button>
            )
          })}
        </div>
      </fieldset>

      <PhotoUploader userId={userId} value={photos} onChange={setPhotos} max={12} label="Property photos (first is the cover)" />

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={property?.is_active ?? true} className="size-4 accent-primary" />
        Show this property in search
      </label>

      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {saved && <p role="status" className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">Property saved.</p>}

      <Button type="submit" className="h-11 sm:w-48" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : property ? 'Save changes' : 'Create property'}
      </Button>
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
