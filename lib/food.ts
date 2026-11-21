export type FoodStatus = 'placed' | 'accepted' | 'preparing' | 'ready' | 'picked_up' | 'completed' | 'cancelled' | 'rejected'
export type Fulfilment = 'delivery' | 'pickup'

export type Addon = { name: string; price: number }

export type Restaurant = {
  id: string
  owner_id: string | null
  country_code: string
  currency: string
  name: string
  description: string | null
  cuisines: string[]
  city: string
  address: string
  lat: number | null
  lng: number | null
  phone: string | null
  logo_url: string | null
  cover_url: string | null
  opens_at: string
  closes_at: string
  is_open: boolean
  is_active: boolean
  offers_delivery: boolean
  offers_pickup: boolean
  prep_minutes: number
  min_order: number
  delivery_radius_km: number
  rating_avg: number | null
  rating_count: number
}

export type MenuCategory = { id: string; restaurant_id: string; name: string; sort_order: number }

export type MenuItem = {
  id: string
  restaurant_id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  photo_url: string | null
  addons: Addon[]
  is_available: boolean
  is_active: boolean
  sort_order: number
}

export type FoodLine = { item_id: string; name: string; qty: number; unit_price: number; addons: Addon[]; line_total: number }

export type FoodQuote = {
  lines: FoodLine[]
  item_count: number
  subtotal: number
  discount: number
  promo_code: string | null
  delivery_fee: number
  distance_km: number | null
  tax: number
  tax_rate: number | null
  total: number
  currency: string
  prep_minutes: number
  error?: string
}

export type FoodOrder = {
  id: string
  reference: string
  customer_id: string
  restaurant_id: string
  owner_id: string | null
  courier_id: string | null
  country_code: string
  currency: string
  fulfilment: Fulfilment
  status: FoodStatus
  items: FoodLine[]
  subtotal: number
  discount_amount: number
  promo_code: string | null
  delivery_fee: number
  tax_amount: number
  total_amount: number
  payment_method: string
  delivery_address: string | null
  distance_km: number | null
  customer_note: string | null
  restaurant_note: string | null
  estimated_ready_at: string | null
  commission_amount: number | null
  restaurant_earnings: number | null
  courier_earnings: number | null
  rating: number | null
  review: string | null
  cancel_reason: string | null
  cancelled_by: string | null
  accepted_at: string | null
  ready_at: string | null
  picked_up_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  created_at: string
}

export const RESTAURANT_SELECT =
  'id, owner_id, country_code, currency, name, description, cuisines, city, address, lat, lng, phone, logo_url, cover_url, opens_at, closes_at, is_open, is_active, offers_delivery, offers_pickup, prep_minutes, min_order, delivery_radius_km, rating_avg, rating_count'

export const MENU_ITEM_SELECT = 'id, restaurant_id, category_id, name, description, price, photo_url, addons, is_available, is_active, sort_order'

export const FOOD_ORDER_SELECT =
  'id, reference, customer_id, restaurant_id, owner_id, courier_id, country_code, currency, fulfilment, status, items, subtotal, discount_amount, promo_code, delivery_fee, tax_amount, total_amount, payment_method, delivery_address, distance_km, customer_note, restaurant_note, estimated_ready_at, commission_amount, restaurant_earnings, courier_earnings, rating, review, cancel_reason, cancelled_by, accepted_at, ready_at, picked_up_at, completed_at, cancelled_at, created_at'

export const FOOD_STATUS_LABELS: Record<FoodStatus, string> = {
  placed: 'Waiting for restaurant',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  picked_up: 'On the way',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Declined',
}

export const FOOD_STATUS_STYLES: Record<FoodStatus, string> = {
  placed: 'bg-accent/20 text-accent-foreground',
  accepted: 'bg-primary/10 text-primary',
  preparing: 'bg-primary/10 text-primary',
  ready: 'bg-primary text-primary-foreground',
  picked_up: 'bg-primary text-primary-foreground',
  completed: 'bg-muted text-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
  rejected: 'bg-destructive/10 text-destructive',
}

export const FOOD_ACTIVE: FoodStatus[] = ['placed', 'accepted', 'preparing', 'ready', 'picked_up']

export const FOOD_CUISINES = ['Local dishes', 'Grills', 'Fast food', 'Breakfast', 'Seafood', 'Vegetarian', 'Desserts', 'Pizza', 'Chinese', 'Drinks', 'Groceries'] as const

export const FOOD_COUNTRIES: Record<string, { name: string; locale: string; cities: string[] }> = {
  GH: { name: 'Ghana', locale: 'en-GH', cities: ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast'] },
  NG: { name: 'Nigeria', locale: 'en-NG', cities: ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano'] },
  CI: { name: "Côte d'Ivoire", locale: 'fr-CI', cities: ['Abidjan', 'Yamoussoukro', 'Bouaké', 'San-Pédro', 'Korhogo'] },
}

export function foodSteps(fulfilment: Fulfilment): { status: FoodStatus; label: string }[] {
  return [
    { status: 'placed', label: 'Order placed' },
    { status: 'accepted', label: 'Accepted' },
    { status: 'preparing', label: 'Preparing' },
    { status: 'ready', label: fulfilment === 'pickup' ? 'Ready for pickup' : 'Ready' },
    ...(fulfilment === 'delivery' ? [{ status: 'picked_up' as FoodStatus, label: 'On the way' }] : []),
    { status: 'completed', label: fulfilment === 'pickup' ? 'Collected' : 'Delivered' },
  ]
}

export function hoursLabel(opens: string, closes: string) {
  return `${opens.slice(0, 5)} – ${closes.slice(0, 5)}`
}
