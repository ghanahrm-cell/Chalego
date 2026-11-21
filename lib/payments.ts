import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

export const PAYABLE_KINDS = ['stay', 'rental', 'food', 'shipment', 'ride'] as const
export type PayableKind = (typeof PAYABLE_KINDS)[number]

export function isPayableKind(value: string): value is PayableKind {
  return (PAYABLE_KINDS as readonly string[]).includes(value)
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type PayableBooking = {
  kind: PayableKind
  id: string
  reference: string
  userId: string
  countryCode: string
  currency: string
  amount: number
  division: string
  description: string
  status: string
  paymentMethod: string
  payable: boolean
  detailPath: string
}

type Row = Record<string, unknown>

const CONFIG: Record<
  PayableKind,
  {
    table: string
    select: string
    owner: string
    blocked: string[]
    path: string
    map: (r: Row) => { reference: string; amount: number; division: string; description: string }
  }
> = {
  stay: {
    table: 'stay_bookings',
    select: 'id, reference, guest_id, country_code, currency, total_amount, kind, status, payment_method',
    owner: 'guest_id',
    blocked: ['cancelled', 'rejected', 'completed'],
    path: '/account/stays',
    map: (r) => ({
      reference: String(r.reference),
      amount: Number(r.total_amount),
      division: r.kind === 'hotel' ? 'hotels' : 'apartments',
      description: `Stay booking ${r.reference}`,
    }),
  },
  rental: {
    table: 'rental_bookings',
    select: 'id, reference, renter_id, country_code, currency, total_amount, kind, status, payment_method',
    owner: 'renter_id',
    blocked: ['cancelled', 'rejected', 'completed'],
    path: '/account/rentals',
    map: (r) => ({
      reference: String(r.reference),
      amount: Number(r.total_amount),
      division: r.kind === 'truck' ? 'truck-rental' : r.kind === 'equipment' ? 'equipment' : 'car-rental',
      description: `Rental booking ${r.reference}`,
    }),
  },
  food: {
    table: 'food_orders',
    select: 'id, reference, customer_id, country_code, currency, total_amount, status, payment_method',
    owner: 'customer_id',
    blocked: ['cancelled', 'rejected', 'completed'],
    path: '/account/food',
    map: (r) => ({
      reference: String(r.reference),
      amount: Number(r.total_amount),
      division: 'food',
      description: `Food order ${r.reference}`,
    }),
  },
  shipment: {
    table: 'shipments',
    select: 'id, tracking_code, customer_id, country_code, currency, fare_estimate, final_fare, kind, status, payment_method',
    owner: 'customer_id',
    blocked: ['cancelled'],
    path: '/account/deliveries',
    map: (r) => ({
      reference: String(r.tracking_code),
      amount: Number(r.final_fare ?? r.fare_estimate),
      division: r.kind === 'moto' ? 'moto-delivery' : 'cargo',
      description: `Delivery ${r.tracking_code}`,
    }),
  },
  ride: {
    table: 'rides',
    select: 'id, rider_id, country_code, currency, fare_estimate, final_fare, airport_id, status, payment_method',
    owner: 'rider_id',
    blocked: ['cancelled'],
    path: '/account/trips',
    map: (r) => ({
      reference: `RIDE-${String(r.id).slice(0, 8).toUpperCase()}`,
      amount: Number(r.final_fare ?? r.fare_estimate),
      division: r.airport_id ? 'airport' : 'rides',
      description: r.airport_id ? 'Airport transfer' : 'Ride',
    }),
  },
}

// Reads the booking with a trusted client and scopes it to the paying user, so the
// amount charged always comes from the database rather than the browser.
export async function loadPayableBooking(
  admin: SupabaseClient,
  kind: PayableKind,
  id: string,
  userId: string,
): Promise<PayableBooking | null> {
  if (!UUID_RE.test(id)) return null
  const cfg = CONFIG[kind]
  const { data } = await admin.from(cfg.table).select(cfg.select).eq('id', id).eq(cfg.owner, userId).maybeSingle<Row>()
  if (!data) return null

  const mapped = cfg.map(data)
  const status = String(data.status)
  return {
    kind,
    id,
    userId,
    countryCode: String(data.country_code),
    currency: String(data.currency).trim().toUpperCase(),
    status,
    paymentMethod: String(data.payment_method),
    payable: !cfg.blocked.includes(status) && Number.isFinite(mapped.amount) && mapped.amount > 0,
    detailPath: `${cfg.path}/${id}`,
    ...mapped,
  }
}

export function newPaymentReference() {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
  return `STR-${stamp}-${rand}`
}
