'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/session'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CODE_RE = /^[A-Z]{2}$/
const CLASSES = ['moto', 'van', 'truck_small', 'truck_large']

function num(value: FormDataEntryValue | null, { positive = false } = {}) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0 || n > 10_000_000 || (positive && n === 0)) return null
  return Math.round(n * 100) / 100
}

export async function adminCancelShipment(form: FormData) {
  const { supabase } = await requireAdmin()
  const id = String(form.get('id') ?? '')
  if (!UUID_RE.test(id)) return
  await supabase.rpc('cancel_shipment', { p_id: id, p_reason: 'Cancelled by operations' })
  revalidatePath('/admin/deliveries')
}

export async function updateDeliveryFare(form: FormData) {
  const { supabase } = await requireAdmin()
  const country_code = String(form.get('country_code') ?? '')
  const vehicle_class = String(form.get('vehicle_class') ?? '')
  if (!CODE_RE.test(country_code) || !CLASSES.includes(vehicle_class)) return
  const values = {
    base_fare: num(form.get('base_fare')),
    per_km: num(form.get('per_km')),
    per_kg: num(form.get('per_kg')),
    min_fare: num(form.get('min_fare')),
    max_weight_kg: num(form.get('max_weight_kg'), { positive: true }),
    is_active: form.get('is_active') === 'on',
    updated_at: new Date().toISOString(),
  }
  if (Object.values(values).some((v) => v === null)) return
  await supabase.from('delivery_fares').update(values).eq('country_code', country_code).eq('vehicle_class', vehicle_class)
  revalidatePath('/admin/deliveries')
}
