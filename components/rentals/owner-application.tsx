'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { fieldClass } from '@/lib/account'
import { errorMessage } from '@/lib/rides'
import { cn } from '@/lib/utils'

type Owner = {
  owner_type: 'individual' | 'fleet'
  business_name: string
  registration_number: string | null
  phone: string
  city: string
  payout_details: string | null
} | null

const COPY = {
  rentals: {
    individual: { title: 'Individual owner', hint: 'Rent out your own car or truck', name: 'Display name' },
    fleet: { title: 'Fleet company', hint: 'Registered business with multiple vehicles', name: 'Company name' },
    cityLabel: 'City',
  },
  food: {
    individual: { title: 'Independent restaurant', hint: 'A single restaurant, chop bar or home kitchen', name: 'Restaurant name' },
    fleet: { title: 'Restaurant group', hint: 'Registered business with several outlets or brands', name: 'Registered company name' },
    cityLabel: 'City where you operate',
  },
} as const

export type ApplicationVariant = keyof typeof COPY

export function OwnerApplication({
  owner,
  defaultPhone,
  defaultName,
  variant = 'rentals',
}: {
  owner: Owner
  defaultPhone: string
  defaultName: string
  variant?: ApplicationVariant
}) {
  const copy = COPY[variant]
  const router = useRouter()
  const [type, setType] = useState<'individual' | 'fleet'>(owner?.owner_type ?? 'individual')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function submit(f: FormData) {
    setPending(true)
    setError('')
    const { error } = await createClient().rpc('submit_rental_owner', {
      p_type: type,
      p_business: String(f.get('business') ?? ''),
      p_registration: String(f.get('registration') ?? ''),
      p_phone: String(f.get('phone') ?? ''),
      p_city: String(f.get('city') ?? ''),
      p_payout: String(f.get('payout') ?? ''),
    })
    setPending(false)
    if (error) return setError(errorMessage(error))
    router.refresh()
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit(new FormData(e.currentTarget))
      }}
      className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2"
    >
      <div role="radiogroup" aria-label="Partner type" className="grid grid-cols-2 gap-2 sm:col-span-2">
        {(['individual', 'fleet'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => setType(t)}
            className={cn('rounded-xl border p-3 text-left', type === t ? 'border-primary bg-primary/5' : 'hover:border-foreground/30')}
          >
            <span className="block text-sm font-semibold">{copy[t].title}</span>
            <span className="text-xs text-muted-foreground">{copy[t].hint}</span>
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
        {copy[type].name}
        <input name="business" required minLength={2} maxLength={120} defaultValue={owner?.business_name ?? defaultName} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
        Business registration no.{type === 'individual' ? ' (optional)' : ''}
        <input name="registration" required={type === 'fleet'} minLength={type === 'fleet' ? 3 : undefined} maxLength={60} defaultValue={owner?.registration_number ?? ''} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
        Contact phone
        <input name="phone" type="tel" required minLength={6} maxLength={20} defaultValue={owner?.phone ?? defaultPhone} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
        {copy.cityLabel}
        <input name="city" required minLength={2} maxLength={80} defaultValue={owner?.city ?? ''} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground sm:col-span-2">
        Payout account (mobile money number or bank account)
        <input name="payout" maxLength={200} defaultValue={owner?.payout_details ?? ''} className={fieldClass} placeholder="e.g. MTN MoMo 024 000 0000" />
      </label>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2">{error}</p>}
      <Button type="submit" className="h-11 sm:col-span-2" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : owner ? 'Resubmit application' : 'Submit application'}
      </Button>
    </form>
  )
}
