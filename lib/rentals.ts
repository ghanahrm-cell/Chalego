export type RentalKind = 'vehicle' | 'truck'
export type DriveOptions = 'self_drive' | 'with_driver' | 'both'
export type RentalStatus = 'requested' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'rejected'

export type RentalCategory = { code: string; kind: RentalKind; name: string; description: string; sort_order: number }

export type RentalVehicle = {
  id: string
  owner_id: string | null
  kind: RentalKind
  category_code: string
  country_code: string
  currency: string
  city: string
  pickup_address: string
  title: string
  make: string
  model: string
  year: number
  transmission: 'automatic' | 'manual'
  fuel_type: string
  seats: number
  load_capacity_kg: number | null
  cargo_volume_m3: number | null
  features: string[]
  description: string
  photos: string[]
  hourly_rate: number | null
  daily_rate: number
  weekly_rate: number | null
  monthly_rate: number | null
  security_deposit: number
  drive_options: DriveOptions
  driver_daily_fee: number
  delivery_available: boolean
  delivery_fee: number
  min_hours: number
  status: 'pending' | 'active' | 'paused' | 'rejected'
  review_note: string | null
  rating_avg: number
  rating_count: number
  created_at: string
}

export type RentalQuote = {
  hours: number
  days: number
  label: string
  base: number
  driver_fee: number
  delivery_fee: number
  subtotal: number
  tax: number
  tax_rate: number
  total: number
  deposit: number
  currency: string
}

export const KIND_META: Record<RentalKind, { title: string; noun: string; slug: string }> = {
  vehicle: { title: 'Vehicle rentals', noun: 'vehicle', slug: 'vehicle-rentals' },
  truck: { title: 'Truck rentals', noun: 'truck', slug: 'truck-rentals' },
}

export const DRIVE_LABELS: Record<DriveOptions, string> = {
  self_drive: 'Self-drive',
  with_driver: 'With driver',
  both: 'Self-drive or with driver',
}

export const FUEL_TYPES = ['petrol', 'diesel', 'hybrid', 'electric', 'cng'] as const
export const FUEL_LEVELS = [
  { value: 'empty', label: 'Empty' },
  { value: 'quarter', label: '1/4' },
  { value: 'half', label: '1/2' },
  { value: 'three_quarter', label: '3/4' },
  { value: 'full', label: 'Full' },
] as const

export const ID_TYPES = [
  { value: 'national_id', label: 'National ID (Ghana Card / NIN)' },
  { value: 'passport', label: 'Passport' },
  { value: 'drivers_license', label: "Driver's licence" },
  { value: 'voters_id', label: "Voter's ID" },
] as const

export const RENTAL_STATUS_STYLES: Record<RentalStatus, string> = {
  requested: 'bg-accent/20 text-accent-foreground',
  confirmed: 'bg-primary/10 text-primary',
  active: 'bg-primary text-primary-foreground',
  completed: 'bg-muted text-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
  rejected: 'bg-destructive/10 text-destructive',
}

export const LISTING_STATUS_STYLES: Record<RentalVehicle['status'], string> = {
  pending: 'bg-accent/20 text-accent-foreground',
  active: 'bg-primary/10 text-primary',
  paused: 'bg-muted text-muted-foreground',
  rejected: 'bg-destructive/10 text-destructive',
}

export const RENTAL_COUNTRY_OFFSET: Record<string, string> = { GH: '+00:00', NG: '+01:00', CI: '+00:00' }

export const AGREEMENT_V1 = [
  'I will return the vehicle on the agreed date and time, in the same condition and with the same fuel level recorded at pickup.',
  'I hold a valid driving licence for this class of vehicle when choosing self-drive, and only I will drive it.',
  'The security deposit is held against damage, fines, fuel shortfall or late return and is refunded after inspection.',
  'I am liable for traffic fines, tolls and damage caused by negligence during the rental period.',
  'The vehicle may not be used for racing, sub-letting, illegal activity or to leave the country without written consent.',
  'Cancellations are free until pickup. No-shows and late returns may be charged at the daily rate.',
]

export const RENTAL_SELECT =
  'id, owner_id, kind, category_code, country_code, currency, city, pickup_address, title, make, model, year, transmission, fuel_type, seats, load_capacity_kg, cargo_volume_m3, features, description, photos, hourly_rate, daily_rate, weekly_rate, monthly_rate, security_deposit, drive_options, driver_daily_fee, delivery_available, delivery_fee, min_hours, status, review_note, rating_avg, rating_count, created_at'

export function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, ' ') : s
}

export function formatCapacity(kg: number | null) {
  if (!kg) return null
  return kg >= 1000 ? `${(kg / 1000).toLocaleString('en', { maximumFractionDigits: 1 })} t` : `${kg} kg`
}

export function toIsoFromDate(date: string | undefined, country: string, time = '09:00') {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const d = new Date(`${date}T${time}:00${RENTAL_COUNTRY_OFFSET[country] ?? '+00:00'}`)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export function formatRange(start: string, end: string, locale = 'en-GH') {
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`
}
