import 'server-only'
import type { PaymentMethod } from '@/lib/account'
import { requireUser } from '@/lib/session'

export async function getBookingContext(next: string) {
  const session = await requireUser(next)
  const { supabase, profile, country } = session
  const countryCode = profile?.country_code ?? 'GH'

  const { data: methods } = await supabase
    .from('country_payment_methods')
    .select('id, country_code, provider, display_name, is_enabled, sort_order')
    .eq('country_code', countryCode)
    .eq('is_enabled', true)
    .order('sort_order')
    .returns<PaymentMethod[]>()

  return {
    ...session,
    countryCode,
    locale: country?.locale ?? 'en-GH',
    countryName: country?.name ?? 'Ghana',
    methods: methods ?? [],
  }
}
