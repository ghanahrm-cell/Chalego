import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdminRole, type CountryRow, type Profile } from '@/lib/account'

export const getSessionProfile = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, phone, country_code, avatar_url, role, created_at')
    .eq('id', user.id)
    .single<Profile>()

  const { data: country } = await supabase
    .from('countries')
    .select('code, name, currency_code, locale, dial_code, timezone, commission_rate, tax_rate, is_active')
    .eq('code', profile?.country_code ?? 'GH')
    .single<CountryRow>()

  return { supabase, user, profile, country }
})

export async function requireUser(next = '/account') {
  const session = await getSessionProfile()
  if (!session) redirect(`/auth/login?next=${encodeURIComponent(next)}`)
  return session
}

export async function requireAdmin() {
  const session = await requireUser('/admin')
  if (!isAdminRole(session.profile?.role)) redirect('/account?denied=admin')
  return session
}
