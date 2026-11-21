export type LatLng = { lat: number; lng: number }

export type Place = LatLng & { label: string }

export type RideStatus = 'requested' | 'accepted' | 'arriving' | 'in_progress' | 'completed' | 'cancelled'

export type FareOption = {
  category_code: string
  name: string
  description: string
  seats: number
  distance_km: number
  duration_min: number
  fare: number
  currency: string
  is_fixed?: boolean
}

export type Airport = {
  id: string
  iata: string
  name: string
  city: string
  country_code: string
  lat: number
  lng: number
}

export type RideSummary = {
  id: string
  ride_type: 'standard' | 'airport'
  category_code: string
  pickup_address: string
  dropoff_address: string
  fare_estimate: number
  final_fare: number | null
  currency: string
  status: RideStatus
  scheduled_for: string | null
  created_at: string
}

export type RideDetails = RideSummary & {
  viewer: 'rider' | 'driver' | 'admin'
  category_name: string
  pickup_lat: number
  pickup_lng: number
  dropoff_lat: number
  dropoff_lng: number
  distance_km: number
  duration_min: number
  payment_method: string
  commission_amount: number | null
  driver_earnings: number | null
  flight_number: string | null
  passengers: number | null
  luggage: number | null
  service_level: string | null
  airport_direction: 'from_airport' | 'to_airport' | null
  notes: string | null
  rating: number | null
  review: string | null
  cancelled_by: string | null
  cancel_reason: string | null
  accepted_at: string | null
  started_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  airport?: { iata: string; name: string }
  driver?: {
    name: string
    vehicle: string
    plate: string
    rating: number
    rating_count: number
    phone: string | null
    lat: number | null
    lng: number | null
    last_seen_at: string | null
  }
  rider: { name: string; phone: string | null }
}

export type AvailableRide = {
  id: string
  category_code: string
  ride_type: 'standard' | 'airport'
  pickup_address: string
  pickup_lat: number
  pickup_lng: number
  dropoff_address: string
  distance_km: number
  duration_min: number
  fare_estimate: number
  currency: string
  payment_method: string
  scheduled_for: string | null
  flight_number: string | null
  passengers: number | null
  luggage: number | null
  service_level: string | null
  away_km: number | null
  created_at: string
}

export const STATUS_LABEL: Record<RideStatus, string> = {
  requested: 'Finding a driver',
  accepted: 'Driver assigned',
  arriving: 'Driver arriving',
  in_progress: 'On trip',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const STATUS_STYLE: Record<RideStatus, string> = {
  requested: 'bg-accent/20 text-accent-foreground',
  accepted: 'bg-primary/10 text-primary',
  arriving: 'bg-primary/10 text-primary',
  in_progress: 'bg-primary text-primary-foreground',
  completed: 'bg-secondary text-secondary-foreground',
  cancelled: 'bg-muted text-muted-foreground',
}

export const ACTIVE_STATUSES: RideStatus[] = ['requested', 'accepted', 'arriving', 'in_progress']

export const COUNTRY_CENTER: Record<string, LatLng> = {
  GH: { lat: 5.6037, lng: -0.187 },
  NG: { lat: 6.5244, lng: 3.3792 },
  CI: { lat: 5.36, lng: -4.0083 },
}

export const SERVICE_LEVELS = [
  { value: 'standard', label: 'Standard', hint: 'Kerbside pickup' },
  { value: 'vip', label: 'VIP meet & greet', hint: 'Name board in arrivals, +50%' },
  { value: 'corporate', label: 'Corporate', hint: 'Invoice-ready receipt' },
  { value: 'group', label: 'Group', hint: 'Extra luggage space' },
] as const

export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    const msg = error.message
    if (msg && !/permission denied|violates|syntax|function .* does not exist/i.test(msg)) return msg
  }
  return fallback
}

export function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
