'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/session'
import type { ActionState } from '@/lib/account'

const CODE_RE = /^[A-Z]{2}$/
const UUID_RE = /^[0-9a-f-]{36}$/i

function rate(value: FormDataEntryValue | null) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 && n <= 100 ? Math.round(n * 100) / 100 : null
}

export async function updateCountry(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const code = String(form.get('code') ?? '').toUpperCase()
  const commission_rate = rate(form.get('commission_rate'))
  const tax_rate = rate(form.get('tax_rate'))
  const is_active = form.get('is_active') === 'on'

  if (!CODE_RE.test(code)) return { ok: false, message: 'Invalid country.' }
  if (commission_rate === null || tax_rate === null) return { ok: false, message: 'Rates must be between 0 and 100.' }

  const { error } = await supabase.from('countries').update({ commission_rate, tax_rate, is_active }).eq('code', code)
  if (error) return { ok: false, message: 'Could not save. Check your permissions.' }

  revalidatePath('/admin', 'layout')
  return { ok: true, message: 'Saved.' }
}

export async function togglePaymentMethod(form: FormData) {
  const { supabase } = await requireAdmin()
  const id = String(form.get('id') ?? '')
  const enable = form.get('enable') === 'true'
  if (!UUID_RE.test(id)) return
  await supabase.from('country_payment_methods').update({ is_enabled: enable }).eq('id', id)
  revalidatePath('/admin/payment-methods')
}
