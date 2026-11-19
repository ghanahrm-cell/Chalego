'use client'

import { useCountry } from '@/components/country-provider'
import { COUNTRIES, type CountryCode } from '@/lib/countries'
import { cn } from '@/lib/utils'

export function CountrySwitcher({ className }: { className?: string }) {
  const { country, setCountryCode } = useCountry()

  return (
    <div role="group" aria-label="Select country" className={cn('flex rounded-full border bg-muted p-0.5', className)}>
      {(Object.keys(COUNTRIES) as CountryCode[]).map((code) => {
        const active = country.code === code
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            onClick={() => setCountryCode(code)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
              active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {COUNTRIES[code].name}
            <span className="sr-only"> ({COUNTRIES[code].currency})</span>
          </button>
        )
      })}
    </div>
  )
}
