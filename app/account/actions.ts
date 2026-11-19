'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ActionState } from '@/lib/account'

const PHONE_RE = /^\+[0-9]{8,15}$/
const UUID_RE = /^[0-9a-f-]{36}$/i

async function getUserOrThrow() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  return { supabase, user }
}

function text(form: FormData, key: string, max: number) {
  return String(form.get(key) ?? '').trim().slice(0, max)
}

export async function updateProfile(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await getUserOrThrow()
  const full_name = text(form, 'full_name', 120)
  const phone = text(form, 'phone', 20).replace(/[\s-]/g, '')
  const country_code = text(form, 'country_code', 2).toUpperCase()

  if (!full_name) return { ok: false, message: 'Please enter your full name.' }
  if (phone && !PHONE_RE.test(phone)) return { ok: false, message: 'Enter your phone in international format, e.g. +233241234567.' }

  const { data: country } = await supabase.from('countries').select('code').eq('code', country_code).eq('is_active', true).maybeSingle()
  if (!country) return { ok: false, message: 'Please choose a supported country.' }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name, phone: phone || null, country_code })
    .eq('id', user.id)
  if (error) return { ok: false, message: 'We could not save your profile. Please try again.' }

  revalidatePath('/account', 'layout')
  return { ok: true, message: 'Profile saved.' }
}

export async function addAddress(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await getUserOrThrow()
  const label = text(form, 'label', 40)
  const line1 = text(form, 'line1', 200)
  const city = text(form, 'city', 80)
  const country_code = text(form, 'country_code', 2).toUpperCase()
  const is_default = form.get('is_default') === 'on'

  if (!label || !line1 || !city) return { ok: false, message: 'Label, address and city are required.' }

  const { count } = await supabase.from('addresses').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
  if ((count ?? 0) >= 20) return { ok: false, message: 'You can save up to 20 places.' }

  if (is_default) await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id)

  const { error } = await supabase
    .from('addresses')
    .insert({ user_id: user.id, label, line1, city, country_code, is_default: is_default || count === 0 })
  if (error) return { ok: false, message: 'We could not save this place. Please try again.' }

  revalidatePath('/account/addresses')
  return { ok: true, message: 'Place saved.' }
}

export async function deleteAddress(form: FormData) {
  const { supabase, user } = await getUserOrThrow()
  const id = String(form.get('id') ?? '')
  if (!UUID_RE.test(id)) return
  await supabase.from('addresses').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/account/addresses')
}

export async function setDefaultAddress(form: FormData) {
  const { supabase, user } = await getUserOrThrow()
  const id = String(form.get('id') ?? '')
  if (!UUID_RE.test(id)) return
  await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id)
  await supabase.from('addresses').update({ is_default: true }).eq('id', id).eq('user_id', user.id)
  revalidatePath('/account/addresses')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
