'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import { COUNTRIES, type Country, type CountryCode } from '@/lib/countries'

type CountryContextValue = {
  country: Country
  setCountryCode: (code: CountryCode) => void
  formatPrice: (prices: Record<CountryCode, number>) => string
}

const CountryContext = createContext<CountryContextValue | null>(null)

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [code, setCountryCode] = useState<CountryCode>('GH')

  const value = useMemo<CountryContextValue>(() => {
    const country = COUNTRIES[code]
    const formatter = new Intl.NumberFormat(country.locale, {
      style: 'currency',
      currency: country.currency,
      maximumFractionDigits: 0,
    })
    return {
      country,
      setCountryCode,
      formatPrice: (prices) => formatter.format(prices[code]),
    }
  }, [code])

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>
}

export function useCountry() {
  const ctx = useContext(CountryContext)
  if (!ctx) throw new Error('useCountry must be used within CountryProvider')
  return ctx
}
