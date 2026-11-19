'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PhotoUploader } from '@/components/rentals/photo-uploader'
import { LocationInput } from '@/components/rides/location-input'
import { createClient } from '@/lib/supabase/client'
import { fieldClass } from '@/lib/account'
import { errorMessage, type Place } from '@/lib/rides'
import { FOOD_COUNTRIES, FOOD_CUISINES, type Restaurant } from '@/lib/food'
import { cn } from '@/lib/utils'

type Props = { userId: string; defaultCountry: string; initial?: Restaurant }

export function RestaurantForm({ userId, defaultCountry, initial }: Props) {
  const base = useId()
  const router = useRouter()
  const [country, setCountry] = useState(initial?.country_code ?? (FOOD_COUNTRIES[defaultCountry] ? defaultCountry : 'GH'))
  const [cuisines, setCuisines] = useState<string[]>(initial?.cuisines ?? [])
  const [cover, setCover] = useState<string[]>(initial?.cover_url ? [initial.cover_url] : [])
  const [logo, setLogo] = useState<string[]>(initial?.logo_url ? [initial.logo_url] : [])
  const [pin, setPin] = useState<Place | null>(
    initial?.lat != null && initial?.lng != null ? { lat: initial.lat, lng: initial.lng, label: initial.address } : null,
  )
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setPending(true)
    setError('')
    setSaved(false)
    const { data, error } = await createClient().rpc('save_restaurant', {
      p_id: initial?.id ?? null,
      p: {
        country_code: country,
        name: f.get('name'),
        description: f.get('description'),
        cuisines,
        city: f.get('city'),
        address: f.get('address'),
        lat: pin?.lat ?? null,
        lng: pin?.lng ?? null,
        phone: f.get('phone'),
        logo_url: logo[0] ?? '',
        cover_url: cover[0] ?? '',
        opens_at: f.get('opens_at'),
        closes_at: f.get('closes_at'),
        offers_delivery: f.get('offers_delivery') === 'on',
        offers_pickup: f.get('offers_pickup') === 'on',
        prep_minutes: Number(f.get('prep_minutes')),
        min_order: Number(f.get('min_order')),
        delivery_radius_km: Number(f.get('delivery_radius_km')),
        ...(initial ? { is_active: f.get('is_active') === 'on' } : {}),
      },
    })
    setPending(false)
    if (error) return setError(errorMessage(error))
    if (!initial) return router.push(`/partner/food/${data}`)
    setSaved(true)
    router.refresh()
  }

  const field = (name: string, label: string, el: React.ReactElement) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`${base}-${name}`} className="text-xs font-semibold text-muted-foreground">{label}</label>
      {el}
    </div>
  )

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 rounded-2xl border bg-card p-5 md:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {field('name', 'Restaurant name', <input id={`${base}-name`} name="name" required minLength={3} maxLength={80} defaultValue={initial?.name} className={fieldClass} />)}
        {field('phone', 'Phone for orders', <input id={`${base}-phone`} name="phone" type="tel" maxLength={20} defaultValue={initial?.phone ?? ''} className={fieldClass} />)}
      </div>
      {field(
        'description',
        'Description',
        <textarea id={`${base}-description`} name="description" rows={3} maxLength={1000} defaultValue={initial?.description ?? ''} className={cn(fieldClass, 'h-auto py-2')} />,
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-semibold text-muted-foreground">Cuisines (up to 6)</legend>
        <div className="flex flex-wrap gap-2">
          {FOOD_CUISINES.map((c) => {
            const on = cuisines.includes(c)
            return (
              <button
                key={c}
                type="button"
                aria-pressed={on}
                disabled={!on && cuisines.length >= 6}
                onClick={() => setCuisines((x) => (on ? x.filter((y) => y !== c) : [...x, c]))}
                className={cn('rounded-full border px-3 py-1.5 text-sm disabled:opacity-40', on ? 'border-primary bg-primary text-primary-foreground' : 'bg-background')}
              >
                {c}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        {field(
          'country',
          'Country',
          <select id={`${base}-country`} value={country} onChange={(e) => { setCountry(e.target.value); setPin(null) }} disabled={Boolean(initial)} className={fieldClass}>
            {Object.entries(FOOD_COUNTRIES).map(([code, c]) => <option key={code} value={code}>{c.name}</option>)}
          </select>,
        )}
        {field('city', 'City', <input id={`${base}-city`} name="city" required minLength={2} maxLength={60} list={`${base}-cities`} defaultValue={initial?.city} className={fieldClass} />)}
        {field('address', 'Street address', <input id={`${base}-address`} name="address" required minLength={5} maxLength={160} defaultValue={initial?.address} className={fieldClass} />)}
        <datalist id={`${base}-cities`}>
          {FOOD_COUNTRIES[country]?.cities.map((c) => <option key={c} value={c} />)}
        </datalist>
      </div>
      <div className="flex flex-col gap-1">
        <LocationInput label="Map location (riders use this for pickup)" country={country} value={pin} onChange={setPin} placeholder="Search the restaurant location" allowCurrentLocation />
        {!pin && <p className="text-xs text-muted-foreground">Delivery stays off for customers until you set a map location.</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {field('opens_at', 'Opens', <input id={`${base}-opens_at`} name="opens_at" type="time" required defaultValue={initial?.opens_at?.slice(0, 5) ?? '08:00'} className={fieldClass} />)}
        {field('closes_at', 'Closes', <input id={`${base}-closes_at`} name="closes_at" type="time" required defaultValue={initial?.closes_at?.slice(0, 5) ?? '22:00'} className={fieldClass} />)}
        {field('prep_minutes', 'Usual prep time (min)', <input id={`${base}-prep_minutes`} name="prep_minutes" type="number" min={5} max={180} required defaultValue={initial?.prep_minutes ?? 25} className={fieldClass} />)}
        {field('min_order', 'Minimum order', <input id={`${base}-min_order`} name="min_order" type="number" min={0} step="0.01" required defaultValue={initial?.min_order ?? 0} className={fieldClass} />)}
        {field('delivery_radius_km', 'Delivery radius (km)', <input id={`${base}-delivery_radius_km`} name="delivery_radius_km" type="number" min={1} max={40} step="0.5" required defaultValue={initial?.delivery_radius_km ?? 10} className={fieldClass} />)}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="offers_delivery" defaultChecked={initial?.offers_delivery ?? true} className="size-4 accent-primary" /> Offer delivery</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="offers_pickup" defaultChecked={initial?.offers_pickup ?? true} className="size-4 accent-primary" /> Offer pickup</label>
        {initial && <label className="flex items-center gap-2"><input type="checkbox" name="is_active" defaultChecked={initial.is_active} className="size-4 accent-primary" /> Listed on CHALEGO</label>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PhotoUploader userId={userId} value={cover} onChange={setCover} max={1} label="Cover photo" />
        <PhotoUploader userId={userId} value={logo} onChange={setLogo} max={1} label="Logo" />
      </div>

      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {saved && <p role="status" className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">Saved.</p>}
      <Button type="submit" className="h-11 self-start px-6" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {initial ? 'Save changes' : 'Create restaurant'}
      </Button>
    </form>
  )
}
