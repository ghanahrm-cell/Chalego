'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCountry } from '@/components/country-provider'
import { COUNTRIES, type CountryCode } from '@/lib/countries'
import { createClient } from '@/lib/supabase/client'
import { fieldClass } from '@/lib/account'

function signUpErrorMessage(error: unknown) {
  const { code, status } = (error ?? {}) as { code?: string; status?: number }
  if (code === 'weak_password') return 'Choose a stronger password: at least 8 characters with letters and numbers.'
  if (code === 'email_address_invalid') return 'Please enter a valid email address.'
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || status === 429)
    return 'Too many attempts. Please wait a moment and try again.'
  return 'We could not create your account. Please try again.'
}

export function SignUpForm() {
  const router = useRouter()
  const { country } = useCountry()
  const [countryCode, setCountryCode] = useState<CountryCode>(country.code)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const password = String(form.get('password'))
    if (password !== String(form.get('confirm'))) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    const local = String(form.get('phone') ?? '').replace(/\D/g, '').replace(/^0/, '')
    setLoading(true)
    setError(null)
    const { error } = await createClient().auth.signUp({
      email: String(form.get('email')),
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
        data: {
          full_name: String(form.get('full_name')).trim().slice(0, 120),
          phone: local ? `${COUNTRIES[countryCode].dialCode}${local}` : '',
          country_code: countryCode,
        },
      },
    })
    if (error) {
      setError(signUpErrorMessage(error))
      setLoading(false)
      return
    }
    router.push('/auth/sign-up-success')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="full_name" className="text-sm font-medium">Full name</label>
        <input id="full_name" name="full_name" autoComplete="name" required maxLength={120} className={fieldClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className={fieldClass} />
      </div>
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="country" className="text-sm font-medium">Country</label>
          <select
            id="country"
            name="country"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value as CountryCode)}
            className={fieldClass}
          >
            {Object.values(COUNTRIES).map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-sm font-medium">Phone number</label>
          <div className="flex">
            <span className="flex h-11 items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
              {COUNTRIES[countryCode].dialCode}
            </span>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              pattern="[0-9 ]{7,14}"
              title="Enter 7 to 14 digits"
              className={`${fieldClass} rounded-l-none`}
            />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className={fieldClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm" className="text-sm font-medium">Confirm password</label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} className={fieldClass} />
        </div>
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      <Button type="submit" size="lg" className="h-11" disabled={loading}>
        {loading ? 'Creating account…' : 'Create account'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {'Already have an account? '}
        <Link href="/auth/login" className="font-medium text-primary underline-offset-4 hover:underline">Log in</Link>
      </p>
    </form>
  )
}
