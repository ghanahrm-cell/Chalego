export type Role = 'customer' | 'driver' | 'rider' | 'partner' | 'corporate' | 'admin' | 'super_admin'

export type Profile = {
  id: string
  full_name: string | null
  phone: string | null
  country_code: string
  avatar_url: string | null
  role: Role
  created_at: string
}

export type CountryRow = {
  code: string
  name: string
  currency_code: string
  locale: string
  dial_code: string
  timezone: string
  commission_rate: number
  tax_rate: number
  is_active: boolean
}

export type Address = {
  id: string
  label: string
  line1: string
  city: string
  country_code: string
  is_default: boolean
}

export type Transaction = {
  id: string
  amount: number
  currency: string
  division: string
  payment_type: string
  provider: string
  reference: string
  status: 'pending' | 'success' | 'failed' | 'refunded' | 'cancelled'
  description: string | null
  created_at: string
}

export type PaymentMethod = {
  id: string
  country_code: string
  provider: string
  display_name: string
  is_enabled: boolean
  sort_order: number
}

export type ActionState = { ok: boolean; message: string } | null

export const fieldClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-60'

export function formatMoney(amount: number, currency: string, locale = 'en-GH') {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export function safeNextPath(next: string | null | undefined, fallback = '/account') {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  return next
}

export function isAdminRole(role: Role | undefined | null) {
  return role === 'admin' || role === 'super_admin'
}
