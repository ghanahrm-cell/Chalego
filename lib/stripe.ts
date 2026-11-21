import 'server-only'
import Stripe from 'stripe'

let client: Stripe | null = null

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Stripe is not configured')
  client ??= new Stripe(key, { maxNetworkRetries: 2, appInfo: { name: 'Chalego' } })
  return client
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
}

export function stripeMode(): 'live' | 'test' | 'unconfigured' {
  const key = process.env.STRIPE_SECRET_KEY ?? ''
  if (key.startsWith('sk_live_') || key.startsWith('rk_live_')) return 'live'
  if (key) return 'test'
  return 'unconfigured'
}

// Stripe expresses these currencies without minor units.
const ZERO_DECIMAL = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
])

export function toMinorUnits(amount: number, currency: string) {
  return ZERO_DECIMAL.has(currency.toUpperCase()) ? Math.round(amount) : Math.round(amount * 100)
}

export function fromMinorUnits(amount: number, currency: string) {
  return ZERO_DECIMAL.has(currency.toUpperCase()) ? amount : amount / 100
}
