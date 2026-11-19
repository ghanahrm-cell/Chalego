'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/session'
import type { ActionState } from '@/lib/account'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ROLES = ['customer', 'driver', 'rider', 'partner', 'corporate', 'admin', 'super_admin']

export async function setUserRole(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, profile } = await requireAdmin()
  if (profile?.role !== 'super_admin') return { ok: false, message: 'Only super admins can change roles.' }
  const id = String(form.get('id') ?? '')
  const role = String(form.get('role') ?? '')
  if (!UUID_RE.test(id) || !ROLES.includes(role)) return { ok: false, message: 'Invalid request.' }
  const { error } = await supabase.rpc('admin_set_role', { p_user: id, p_role: role })
  if (error) return { ok: false, message: error.message }
  revalidatePath('/admin/users')
  return { ok: true, message: 'Role updated.' }
}
