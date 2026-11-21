'use client'

import { useCountry } from '@/components/country-provider'
import { useLanguage } from '@/components/language-provider'
import { COUNTRIES, type CountryCode } from '@/lib/countries'
import { COUNTRY_NAMES } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function CountrySwitcher({ className }: { className?: string }) {
  const { country, setCountryCode } = useCountry()
  const { lang, t } = useLanguage()

  return (
    <div role="group" aria-label={t('nav.selectCountry')} className={cn('flex rounded-full border bg-muted p-0.5', className)}>
      {(Object.keys(COUNTRIES) as CountryCode[]).map((code) => {
        const active = country.code === code
        const name = COUNTRY_NAMES[lang][code] ?? COUNTRIES[code].name
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            title={`${name} (${COUNTRIES[code].currency})`}
            onClick={() => setCountryCode(code)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
              active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span aria-hidden="true">{code}</span>
            <span className="sr-only">
              {name} ({COUNTRIES[code].currency})
            </span>
          </button>
        )
      })}
    </div>
  )
}
