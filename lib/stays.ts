export type StayKind = 'hotel' | 'apartment'
export type StayStatus = 'requested' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'rejected'

export type StayProperty = {
  id: string
  owner_id: string | null
  kind: StayKind
  title: string
  description: string | null
  country_code: string
  currency: string
  city: string
  address: string
  lat: number | null
  lng: number | null
  star_rating: number | null
  amenities: string[]
  house_rules: string | null
  check_in_time: string
  check_out_time: string
  photos: string[]
  is_active: boolean
  rating_avg: number | null
  rating_count: number
}

export type StayUnit = {
  id: string
  property_id: string
  name: string
  description: string | null
  max_guests: number
  bedrooms: number
  beds: number
  bathrooms: number
  nightly_rate: number
  cleaning_fee: number
  weekly_discount_pct: number
  monthly_discount_pct: number
  quantity: number
  min_nights: number
  is_active: boolean
}

export type StaySearchRow = {
  id: string
  kind: StayKind
  title: string
  city: string
  address: string
  star_rating: number | null
  photos: string[]
  amenities: string[]
  currency: string
  from_price: number
  rating_avg: number | null
  rating_count: number
  host_name: string | null
  max_guests: number
}

export type StayQuote = {
  nights: number
  nightly_rate: number
  subtotal: number
  discount: number
  cleaning_fee: number
  tax: number
  tax_rate: number
  total: number
  currency: string
  available: number
  error: string | null
}

export type StayBooking = {
  id: string
  reference: string
  unit_id: string
  property_id: string
  guest_id: string
  owner_id: string | null
  kind: StayKind
  country_code: string
  currency: string
  check_in: string
  check_out: string
  nights: number
  guests: number
  nightly_rate: number
  subtotal: number
  discount_amount: number
  cleaning_fee: number
  tax_amount: number
  total_amount: number
  commission_amount: number | null
  owner_earnings: number | null
  payment_method: string
  status: StayStatus
  guest_note: string | null
  owner_note: string | null
  cancelled_by: string | null
  cancel_reason: string | null
  rating: number | null
  review: string | null
  created_at: string
}

export const STAY_PROPERTY_SELECT =
  'id, owner_id, kind, title, description, country_code, currency, city, address, lat, lng, star_rating, amenities, house_rules, check_in_time, check_out_time, photos, is_active, rating_avg, rating_count'

export const STAY_UNIT_SELECT =
  'id, property_id, name, description, max_guests, bedrooms, beds, bathrooms, nightly_rate, cleaning_fee, weekly_discount_pct, monthly_discount_pct, quantity, min_nights, is_active'

export const STAY_BOOKING_SELECT =
  'id, reference, unit_id, property_id, guest_id, owner_id, kind, country_code, currency, check_in, check_out, nights, guests, nightly_rate, subtotal, discount_amount, cleaning_fee, tax_amount, total_amount, commission_amount, owner_earnings, payment_method, status, guest_note, owner_note, cancelled_by, cancel_reason, rating, review, created_at'

export const STAY_KIND_META: Record<StayKind, { title: string; noun: string; unit: string; heading: string; tab: string }> = {
  hotel: { title: 'Hotels', noun: 'hotel', unit: 'room', heading: 'Hotels, resorts and guesthouses', tab: 'Hotels' },
  apartment: { title: 'Apartments', noun: 'apartment', unit: 'unit', heading: 'Furnished apartments for short and long stays', tab: 'Apartments' },
}

export function parseStayKind(v: string | undefined): StayKind | null {
  return v === 'hotel' || v === 'apartment' ? v : null
}

export const STAY_STATUS_LABELS: Record<StayStatus, string> = {
  requested: 'Requested',
  confirmed: 'Confirmed',
  checked_in: 'Checked in',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Declined',
}

export const STAY_STATUS_STYLES: Record<StayStatus, string> = {
  requested: 'bg-accent/20 text-accent-foreground',
  confirmed: 'bg-primary/10 text-primary',
  checked_in: 'bg-primary text-primary-foreground',
  completed: 'bg-muted text-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
  rejected: 'bg-destructive/10 text-destructive',
}

export const STAY_AMENITIES = [
  'Wi-Fi',
  'Air conditioning',
  'Parking',
  'Pool',
  'Gym',
  'Restaurant',
  'Breakfast included',
  'Kitchen',
  'Washing machine',
  'Generator backup',
  '24h security',
  'Airport shuttle',
  'Workspace',
  'TV',
  'Hot water',
  'Balcony',
] as const

export const STAY_COUNTRIES: Record<string, { name: string; locale: string; cities: string[] }> = {
  GH: { name: 'Ghana', locale: 'en-GH', cities: ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast'] },
  NG: { name: 'Nigeria', locale: 'en-NG', cities: ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano'] },
  CI: { name: "Côte d'Ivoire", locale: 'fr-CI', cities: ['Abidjan', 'Yamoussoukro', 'Bouaké', 'San-Pédro', 'Korhogo'] },
}

export const isIsoDate = (v: string | undefined): v is string => Boolean(v && /^\d{4}-\d{2}-\d{2}$/.test(v))

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function formatStayDates(checkIn: string, checkOut: string, locale = 'en-GH') {
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  return `${fmt.format(new Date(`${checkIn}T00:00:00Z`))} – ${fmt.format(new Date(`${checkOut}T00:00:00Z`))}`
}

export function nightsLabel(n: number) {
  return `${n} night${n === 1 ? '' : 's'}`
}
