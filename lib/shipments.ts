export type ShipmentStatus = 'requested' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
export type VehicleClass = 'moto' | 'van' | 'truck_small' | 'truck_large'
export type PackageSize = 'small' | 'medium' | 'large' | 'bulk'

export type DeliveryOption = {
  vehicle_class: VehicleClass
  fare: number | null
  express_fare: number | null
  distance_km: number
  max_weight_kg: number
  available: boolean
}

export type Shipment = {
  id: string
  tracking_code: string
  customer_id: string
  courier_id: string | null
  kind: 'moto' | 'cargo'
  vehicle_class: VehicleClass
  service_level: 'standard' | 'express'
  country_code: string
  currency: string
  pickup_address: string
  pickup_lat: number
  pickup_lng: number
  sender_name: string
  sender_phone: string
  dropoff_address: string
  dropoff_lat: number
  dropoff_lng: number
  recipient_name: string
  recipient_phone: string
  package_description: string
  package_size: PackageSize
  weight_kg: number
  declared_value: number | null
  needs_loaders: boolean
  notes: string | null
  distance_km: number
  fare_estimate: number
  final_fare: number | null
  commission_amount: number | null
  courier_earnings: number | null
  payment_method: string
  status: ShipmentStatus
  scheduled_for: string | null
  delivered_to: string | null
  cancelled_by: string | null
  cancel_reason: string | null
  rating: number | null
  review: string | null
  accepted_at: string | null
  picked_up_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  created_at: string
}

export type ShipmentEvent = { status: ShipmentStatus; note: string | null; created_at: string }

export type TrackingResult = {
  tracking_code: string
  kind: 'moto' | 'cargo'
  vehicle_class: VehicleClass
  status: ShipmentStatus
  pickup_area: string
  dropoff_area: string
  courier_name: string | null
  created_at: string
  delivered_at: string | null
  events: { status: ShipmentStatus; note: string | null; at: string }[]
}

export const VEHICLE_CLASSES: { value: VehicleClass; label: string; capacity: string }[] = [
  { value: 'moto', label: 'Motorbike courier', capacity: 'Up to 20 kg' },
  { value: 'van', label: 'Cargo van', capacity: 'Up to 1 tonne' },
  { value: 'truck_small', label: 'Small truck', capacity: 'Up to 3 tonnes' },
  { value: 'truck_large', label: 'Large truck', capacity: 'Up to 10 tonnes' },
]

export const VEHICLE_LABEL = Object.fromEntries(VEHICLE_CLASSES.map((v) => [v.value, v.label])) as Record<VehicleClass, string>

export const MOTO_SIZES: { value: PackageSize; label: string; hint: string; weight: number }[] = [
  { value: 'small', label: 'Small', hint: 'Envelope or documents', weight: 1 },
  { value: 'medium', label: 'Medium', hint: 'Shoebox size', weight: 5 },
  { value: 'large', label: 'Large', hint: 'Up to 20 kg', weight: 15 },
]

export const SHIPMENT_STEPS: ShipmentStatus[] = ['requested', 'accepted', 'picked_up', 'in_transit', 'delivered']

export const SHIPMENT_STATUS_LABEL: Record<ShipmentStatus, string> = {
  requested: 'Finding a courier',
  accepted: 'Courier assigned',
  picked_up: 'Picked up',
  in_transit: 'In transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const SHIPMENT_STATUS_STYLE: Record<ShipmentStatus, string> = {
  requested: 'bg-accent/20 text-accent-foreground',
  accepted: 'bg-primary/10 text-primary',
  picked_up: 'bg-primary/10 text-primary',
  in_transit: 'bg-primary text-primary-foreground',
  delivered: 'bg-secondary text-secondary-foreground',
  cancelled: 'bg-muted text-muted-foreground',
}

export const ACTIVE_SHIPMENT_STATUSES: ShipmentStatus[] = ['requested', 'accepted', 'picked_up', 'in_transit']

export const COURIER_NEXT_ACTION: Partial<Record<ShipmentStatus, string>> = {
  accepted: 'Confirm pickup',
  picked_up: 'Start delivery',
  in_transit: 'Complete delivery',
}
