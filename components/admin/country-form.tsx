'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { updateCountry } from '@/app/admin/actions'
import { fieldClass, type CountryRow } from '@/lib/account'
import { cn } from '@/lib/utils'

export function CountryForm({ country }: { country: CountryRow }) {
  const [state, action, pending] = useActionState(updateCountry, null)
  const id = `country-${country.code}`

  return (
    <form action={action} className="flex flex-col gap-4 rounded-xl border bg-card p-5" aria-labelledby={`${id}-name`}>
      <input type="hidden" name="code" value={country.code} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p id={`${id}-name`} className="font-heading text-lg font-semibold">{country.name}</p>
          <p className="text-sm text-muted-foreground">
            {country.code} · {country.currency_code} · {country.dial_code} · {country.timezone}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-medium',
            country.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          {country.is_active ? 'Live' : 'Inactive'}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-commission`} className="text-sm font-medium">Commission %</label>
          <input id={`${id}-commission`} name="commission_rate" type="number" min={0} max={100} step="0.01" defaultValue={country.commission_rate} className={fieldClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-tax`} className="text-sm font-medium">Tax / VAT %</label>
          <input id={`${id}-tax`} name="tax_rate" type="number" min={0} max={100} step="0.01" defaultValue={country.tax_rate} className={fieldClass} />
        </div>
        <label className="flex h-11 items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="is_active" defaultChecked={country.is_active} className="size-4 accent-primary" />
          Country is live
        </label>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>{pending ? 'Saving…' : 'Save'}</Button>
        <p role="status" aria-live="polite" className={cn('text-sm', state?.ok ? 'text-primary' : 'text-destructive')}>
          {state?.message}
        </p>
      </div>
    </form>
  )
}
