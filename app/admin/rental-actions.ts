'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/session'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function read(form: FormData) {
  return {
    id: String(form.get('id') ?? ''),
    status: String(form.get('status') ?? ''),
    note: String(form.get('note') ?? '').slice(0, 300),
  }
}

export async function reviewRentalOwner(form: FormData) {
  const { supabase } = await requireAdmin()
  const { id, status, note } = read(form)
  if (!UUID_RE.test(id) || !['approved', 'rejected', 'suspended'].includes(status)) return
  await supabase.rpc('review_rental_owner', { p_owner_id: id, p_status: status, p_note: note || null })
  revalidatePath('/admin/rentals')
}

export async function reviewRentalVehicle(form: FormData) {
  const { supabase } = await requireAdmin()
  const { id, status, note } = read(form)
  if (!UUID_RE.test(id) || !['active', 'rejected', 'paused'].includes(status)) return
  await supabase.rpc('review_rental_vehicle', { p_vehicle_id: id, p_status: status, p_note: note || null })
  revalidatePath('/admin/rentals')
}

export async function resolveRentalDamage(form: FormData) {
  const { supabase } = await requireAdmin()
  const { id } = read(form)
  if (!UUID_RE.test(id)) return
  await supabase.rpc('resolve_rental_damage', { p_id: id })
  revalidatePath('/admin/rentals')
}
