export type CountryCode = 'GH' | 'NG'

export type Country = {
  code: CountryCode
  name: string
  currency: 'GHS' | 'NGN'
  locale: string
  dialCode: string
  cities: string[]
  airports: { code: string; name: string; city: string }[]
}

export const COUNTRIES: Record<CountryCode, Country> = {
  GH: {
    code: 'GH',
    name: 'Ghana',
    currency: 'GHS',
    locale: 'en-GH',
    dialCode: '+233',
    cities: ['Accra', 'Kumasi', 'Takoradi', 'Tamale', 'Cape Coast', 'Tema'],
    airports: [{ code: 'ACC', name: 'Kotoka International Airport', city: 'Accra' }],
  },
  NG: {
    code: 'NG',
    name: 'Nigeria',
    currency: 'NGN',
    locale: 'en-NG',
    dialCode: '+234',
    cities: ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu'],
    airports: [
      { code: 'LOS', name: 'Murtala Muhammed International Airport', city: 'Lagos' },
      { code: 'ABV', name: 'Nnamdi Azikiwe International Airport', city: 'Abuja' },
    ],
  },
}

export const EXPANSION_MARKETS = [
  'Kenya',
  'Uganda',
  'Tanzania',
  'Rwanda',
  'South Africa',
  'Zambia',
  "Côte d'Ivoire",
  'Senegal',
]
