'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin, requireUser } from '@/lib/session'
import type { ActionState } from '@/lib/account'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function requestPayout(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireUser('/partner')
  const currency = String(form.get('currency') ?? '').toUpperCase()
  const amount = Number(form.get('amount'))
  const method = String(form.get('method') ?? '')
  const destination = String(form.get('destination') ?? '').trim()

  if (!/^[A-Z]{3}$/.test(currency)) return { ok: false, message: 'Choose a currency.' }
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, message: 'Enter a valid amount.' }
  if (!['mobile_money', 'bank_transfer'].includes(method)) return { ok: false, message: 'Choose a payout method.' }
  if (destination.length < 4 || destination.length > 200) return { ok: false, message: 'Enter the account or wallet number to pay into.' }

  const { data, error } = await supabase.rpc('request_payout', {
    p_currency: currency,
    p_amount: Math.round(amount * 100) / 100,
    p_method: method,
    p_destination: destination,
  })
  if (error) return { ok: false, message: error.message }
  revalidatePath('/partner')
  return { ok: true, message: `Payout ${data} requested. We will notify you once it is processed.` }
}

export async function reviewPayout(form: FormData) {
  const { supabase } = await requireAdmin()
  const id = String(form.get('id') ?? '')
  const status = String(form.get('status') ?? '')
  const note = String(form.get('note') ?? '').slice(0, 300)
  if (!UUID_RE.test(id) || !['approved', 'paid', 'rejected'].includes(status)) return
  await supabase.rpc('admin_review_payout', { p_id: id, p_status: status, p_note: note || null })
  revalidatePath('/admin/payouts')
}
