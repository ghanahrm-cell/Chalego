'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/session'
import type { ActionState } from '@/lib/account'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CODE_RE = /^[A-Z]{2}$/
const CAT_RE = /^[a-z_]{2,20}$/

function money(value: FormDataEntryValue | null, { positive = false } = {}) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0 || n > 10_000_000 || (positive && n === 0)) return null
  return Math.round(n * 100) / 100
}

export async function reviewDriver(form: FormData) {
  const { supabase } = await requireAdmin()
  const id = String(form.get('id') ?? '')
  const status = String(form.get('status') ?? '')
  const note = String(form.get('note') ?? '').slice(0, 300)
  if (!UUID_RE.test(id) || !['approved', 'rejected', 'suspended'].includes(status)) return
  await supabase.rpc('review_driver', { p_driver_id: id, p_status: status, p_note: note || null })
  revalidatePath('/admin/drivers')
}

export async function adminCancelRide(form: FormData) {
  const { supabase } = await requireAdmin()
  const id = String(form.get('id') ?? '')
  if (!UUID_RE.test(id)) return
  await supabase.rpc('admin_cancel_ride', { p_ride_id: id, p_reason: 'Cancelled by operations' })
  revalidatePath('/admin/rides')
}

export async function updateRideFare(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const country_code = String(form.get('country_code') ?? '')
  const category_code = String(form.get('category_code') ?? '')
  if (!CODE_RE.test(country_code) || !CAT_RE.test(category_code)) return { ok: false, message: 'Invalid fare.' }
  const values = {
    base_fare: money(form.get('base_fare')),
    per_km: money(form.get('per_km')),
    per_min: money(form.get('per_min')),
    min_fare: money(form.get('min_fare')),
    booking_fee: money(form.get('booking_fee')),
  }
  if (Object.values(values).some((v) => v === null)) return { ok: false, message: 'All amounts must be valid non-negative numbers.' }
  const { error } = await supabase.from('ride_fares').update(values).eq('country_code', country_code).eq('category_code', category_code)
  if (error) return { ok: false, message: 'Could not save. Check your permissions.' }
  revalidatePath('/admin/fares')
  return { ok: true, message: 'Saved.' }
}

export async function updateAirportFare(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const airport_id = String(form.get('airport_id') ?? '')
  const category_code = String(form.get('category_code') ?? '')
  const fixed_fare = money(form.get('fixed_fare'), { positive: true })
  if (!UUID_RE.test(airport_id) || !CAT_RE.test(category_code)) return { ok: false, message: 'Invalid fare.' }
  if (fixed_fare === null) return { ok: false, message: 'Enter a fare above zero.' }
  const { error } = await supabase.from('airport_fares').upsert({ airport_id, category_code, fixed_fare })
  if (error) return { ok: false, message: 'Could not save. Check your permissions.' }
  revalidatePath('/admin/fares')
  return { ok: true, message: 'Saved.' }
}

export async function toggleAirport(form: FormData) {
  const { supabase } = await requireAdmin()
  const id = String(form.get('id') ?? '')
  if (!UUID_RE.test(id)) return
  await supabase.from('airports').update({ is_active: form.get('enable') === 'true' }).eq('id', id)
  revalidatePath('/admin/fares')
}
