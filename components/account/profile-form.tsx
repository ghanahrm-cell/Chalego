'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { updateProfile } from '@/app/account/actions'
import { fieldClass, type CountryRow, type Profile } from '@/lib/account'
import { FormMessage } from './form-message'

export function ProfileForm({ profile, email, countries }: { profile: Profile | null; email: string; countries: CountryRow[] }) {
  const [state, action, pending] = useActionState(updateProfile, null)

  return (
    <form action={action} className="flex max-w-xl flex-col gap-5 rounded-xl border bg-card p-6">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="full_name" className="text-sm font-medium">Full name</label>
        <input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ''} required maxLength={120} autoComplete="name" className={fieldClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <input id="email" value={email} readOnly disabled className={fieldClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-sm font-medium">Phone</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={profile?.phone ?? ''}
          placeholder="+233241234567"
          autoComplete="tel"
          aria-describedby="phone-hint"
          className={fieldClass}
        />
        <p id="phone-hint" className="text-xs text-muted-foreground">International format, starting with your country code.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="country_code" className="text-sm font-medium">Home country</label>
        <select id="country_code" name="country_code" defaultValue={profile?.country_code ?? 'GH'} aria-describedby="country-hint" className={fieldClass}>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>{c.name} ({c.currency_code})</option>
          ))}
        </select>
        <p id="country-hint" className="text-xs text-muted-foreground">Sets your default currency and payment options.</p>
      </div>
      <FormMessage state={state} />
      <Button type="submit" className="h-11 self-start px-6" disabled={pending}>
        {pending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
