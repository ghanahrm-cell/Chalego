'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { addAddress } from '@/app/account/actions'
import { fieldClass, type CountryRow } from '@/lib/account'
import { FormMessage } from './form-message'

export function AddressForm({ countries, defaultCountry }: { countries: CountryRow[]; defaultCountry: string }) {
  const [state, action, pending] = useActionState(addAddress, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4 rounded-xl border bg-card p-6">
      <h2 className="font-heading text-lg font-semibold">Add a place</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="label" className="text-sm font-medium">Label</label>
          <input id="label" name="label" placeholder="Home, Office, Gym" required maxLength={40} className={fieldClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="city" className="text-sm font-medium">City</label>
          <input id="city" name="city" placeholder="Accra" required maxLength={80} autoComplete="address-level2" className={fieldClass} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="line1" className="text-sm font-medium">Address or landmark</label>
        <input id="line1" name="line1" placeholder="12 Oxford Street, Osu" required maxLength={200} autoComplete="street-address" className={fieldClass} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="address_country" className="text-sm font-medium">Country</label>
          <select id="address_country" name="country_code" defaultValue={defaultCountry} className={fieldClass}>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>
        <label className="flex h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="is_default" className="size-4 accent-primary" />
          Make this my default pickup
        </label>
      </div>
      <FormMessage state={state} />
      <Button type="submit" className="h-11 self-start px-6" disabled={pending}>
        {pending ? 'Saving…' : 'Save place'}
      </Button>
    </form>
  )
}
