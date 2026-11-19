'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PhotoUploader } from '@/components/rentals/photo-uploader'
import { createClient } from '@/lib/supabase/client'
import { fieldClass } from '@/lib/account'
import { errorMessage } from '@/lib/rides'
import { capitalize, FUEL_TYPES, type RentalCategory, type RentalKind, type RentalVehicle } from '@/lib/rentals'
import { cn } from '@/lib/utils'

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn('flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground', className)}>
      {label}
      {children}
    </label>
  )
}

export function VehicleForm({
  categories,
  vehicle,
  userId,
  platform = false,
  currency,
}: {
  categories: RentalCategory[]
  vehicle: RentalVehicle | null
  userId: string
  platform?: boolean
  currency: string
}) {
  const router = useRouter()
  const [kind, setKind] = useState<RentalKind>(vehicle?.kind ?? 'vehicle')
  const [photos, setPhotos] = useState<string[]>(vehicle?.photos ?? [])
  const [drive, setDrive] = useState(vehicle?.drive_options ?? 'both')
  const [delivery, setDelivery] = useState(vehicle?.delivery_available ?? false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const cats = categories.filter((c) => c.kind === kind)
  const num = (n: number | null | undefined) => (n == null ? '' : String(n))

  async function submit(f: FormData) {
    setPending(true)
    setError('')
    const get = (k: string) => String(f.get(k) ?? '').trim()
    const payload = {
      platform,
      country_code: get('country_code') || undefined,
      category_code: get('category_code'),
      city: get('city'),
      pickup_address: get('pickup_address'),
      title: get('title'),
      make: get('make'),
      model: get('model'),
      year: get('year'),
      transmission: get('transmission'),
      fuel_type: get('fuel_type'),
      seats: get('seats'),
      load_capacity_kg: kind === 'truck' ? get('load_capacity_kg') : '',
      cargo_volume_m3: kind === 'truck' ? get('cargo_volume_m3') : '',
      features: get('features').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20),
      description: get('description'),
      photos,
      hourly_rate: get('hourly_rate'),
      daily_rate: get('daily_rate'),
      weekly_rate: get('weekly_rate'),
      monthly_rate: get('monthly_rate'),
      security_deposit: get('security_deposit'),
      drive_options: drive,
      driver_daily_fee: drive === 'self_drive' ? '0' : get('driver_daily_fee'),
      delivery_available: delivery,
      delivery_fee: delivery ? get('delivery_fee') : '0',
      min_hours: get('min_hours'),
    }
    const { data, error } = await createClient().rpc('save_rental_vehicle', { p_id: vehicle?.id ?? null, p: payload })
    setPending(false)
    if (error || !data) return setError(errorMessage(error, 'Could not save this listing.'))
    router.push(platform ? '/admin/rentals' : `/partner/rentals/${data}`)
    router.refresh()
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (photos.length === 0) return setError('Add at least one photo.')
        submit(new FormData(e.currentTarget))
      }}
      className="flex flex-col gap-6"
    >
      <section className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2">
        <h2 className="font-heading text-base font-semibold sm:col-span-2">Vehicle</h2>
        <div role="radiogroup" aria-label="Listing type" className="grid grid-cols-2 gap-2 sm:col-span-2">
          {(['vehicle', 'truck'] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => setKind(k)}
              className={cn('h-11 rounded-lg border text-sm font-medium', kind === k ? 'border-primary bg-primary/10 text-primary' : 'hover:border-foreground/30')}
            >
              {k === 'truck' ? 'Truck' : 'Car, van or bus'}
            </button>
          ))}
        </div>
        {platform && !vehicle && (
          <Field label="Country">
            <select name="country_code" defaultValue="GH" className={fieldClass}>
              <option value="GH">Ghana</option>
              <option value="NG">Nigeria</option>
            </select>
          </Field>
        )}
        <Field label="Category">
          <select key={kind} name="category_code" required defaultValue={vehicle?.kind === kind ? vehicle.category_code : cats[0]?.code} className={fieldClass}>
            {cats.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Listing title" className="sm:col-span-2">
          <input name="title" required minLength={3} maxLength={100} defaultValue={vehicle?.title} placeholder="Toyota Corolla 2022" className={fieldClass} />
        </Field>
        <Field label="Make"><input name="make" required minLength={2} maxLength={40} defaultValue={vehicle?.make} className={fieldClass} /></Field>
        <Field label="Model"><input name="model" required maxLength={40} defaultValue={vehicle?.model} className={fieldClass} /></Field>
        <Field label="Year"><input name="year" type="number" required min={1990} max={2100} defaultValue={vehicle?.year ?? new Date().getFullYear()} className={fieldClass} /></Field>
        <Field label={kind === 'truck' ? 'Cab seats' : 'Seats'}><input name="seats" type="number" required min={1} max={80} defaultValue={vehicle?.seats ?? (kind === 'truck' ? 2 : 5)} className={fieldClass} /></Field>
        <Field label="Transmission">
          <select name="transmission" defaultValue={vehicle?.transmission ?? 'automatic'} className={fieldClass}>
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
          </select>
        </Field>
        <Field label="Fuel">
          <select name="fuel_type" defaultValue={vehicle?.fuel_type ?? 'petrol'} className={fieldClass}>
            {FUEL_TYPES.map((t) => <option key={t} value={t}>{capitalize(t)}</option>)}
          </select>
        </Field>
        {kind === 'truck' && (
          <>
            <Field label="Load capacity (kg)"><input name="load_capacity_kg" type="number" required min={1} max={100000} defaultValue={num(vehicle?.load_capacity_kg)} className={fieldClass} /></Field>
            <Field label="Cargo volume (m³, optional)"><input name="cargo_volume_m3" type="number" min={0} max={200} step="0.1" defaultValue={num(vehicle?.cargo_volume_m3)} className={fieldClass} /></Field>
          </>
        )}
        <Field label="Features (comma separated)" className="sm:col-span-2">
          <input name="features" maxLength={600} defaultValue={vehicle?.features.join(', ')} placeholder="Air conditioning, Bluetooth, Reverse camera" className={fieldClass} />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <textarea name="description" required minLength={20} maxLength={2000} rows={4} defaultValue={vehicle?.description} className={cn(fieldClass, 'h-auto py-2')} />
        </Field>
        <div className="sm:col-span-2"><PhotoUploader userId={userId} value={photos} onChange={setPhotos} max={10} /></div>
      </section>

      <section className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2">
        <h2 className="font-heading text-base font-semibold sm:col-span-2">Location</h2>
        <Field label="City"><input name="city" required minLength={2} maxLength={80} defaultValue={vehicle?.city} className={fieldClass} /></Field>
        <Field label="Pickup address"><input name="pickup_address" required minLength={2} maxLength={200} defaultValue={vehicle?.pickup_address} className={fieldClass} /></Field>
      </section>

      <section className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4">
        <h2 className="font-heading text-base font-semibold sm:col-span-2 lg:col-span-4">Pricing ({currency})</h2>
        <Field label="Daily rate"><input name="daily_rate" type="number" required min={1} step="0.01" defaultValue={num(vehicle?.daily_rate)} className={fieldClass} /></Field>
        <Field label="Hourly rate (optional)"><input name="hourly_rate" type="number" min={1} step="0.01" defaultValue={num(vehicle?.hourly_rate)} className={fieldClass} /></Field>
        <Field label="Weekly rate (optional)"><input name="weekly_rate" type="number" min={1} step="0.01" defaultValue={num(vehicle?.weekly_rate)} className={fieldClass} /></Field>
        <Field label="Monthly rate (optional)"><input name="monthly_rate" type="number" min={1} step="0.01" defaultValue={num(vehicle?.monthly_rate)} className={fieldClass} /></Field>
        <Field label="Security deposit"><input name="security_deposit" type="number" min={0} step="0.01" defaultValue={num(vehicle?.security_deposit ?? 0)} className={fieldClass} /></Field>
        <Field label="Minimum rental (hours)"><input name="min_hours" type="number" min={1} max={720} defaultValue={vehicle?.min_hours ?? 24} className={fieldClass} /></Field>
      </section>

      <section className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2">
        <h2 className="font-heading text-base font-semibold sm:col-span-2">Options</h2>
        <Field label="Drive options">
          <select value={drive} onChange={(e) => setDrive(e.target.value as typeof drive)} className={fieldClass}>
            <option value="both">Self-drive or with driver</option>
            <option value="self_drive">Self-drive only</option>
            <option value="with_driver">With driver only</option>
          </select>
        </Field>
        {drive !== 'self_drive' && (
          <Field label="Driver fee per day"><input name="driver_daily_fee" type="number" min={0} step="0.01" defaultValue={num(vehicle?.driver_daily_fee ?? 0)} className={fieldClass} /></Field>
        )}
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={delivery} onChange={(e) => setDelivery(e.target.checked)} className="size-4 accent-primary" />
          Offer delivery to the renter&apos;s address
        </label>
        {delivery && (
          <Field label="Delivery fee"><input name="delivery_fee" type="number" min={0} step="0.01" defaultValue={num(vehicle?.delivery_fee ?? 0)} className={fieldClass} /></Field>
        )}
      </section>

      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {platform ? 'Fleet listings go live immediately.' : vehicle && vehicle.status !== 'rejected' ? 'Changes apply right away.' : 'New listings are reviewed before going live.'}
        </p>
        <Button type="submit" className="h-11 px-6" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : vehicle ? 'Save changes' : 'Submit listing'}
        </Button>
      </div>
    </form>
  )
}
