import type { SupabaseClient } from '@supabase/supabase-js'

export type FinanceRow = {
  division: string
  currency: string
  completed_count: number
  cancelled_count: number
  open_count: number
  gross: number
  commission: number
  partner_earnings: number
}

export type DailyRow = { day: string; currency: string; commission: number; gross: number }

export const RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last 12 months' },
] as const

export const DIVISION_LABELS: Record<string, string> = {
  rides: 'Rides',
  deliveries: 'Deliveries',
  rentals: 'Car rentals',
  stays: 'Stays',
  food: 'Food',
}

export function resolveRange(raw: string | string[] | undefined) {
  const value = RANGES.find((r) => r.value === raw)?.value ?? '30'
  const to = new Date()
  const from = new Date(to.getTime() - Number(value) * 86_400_000)
  return { value, from, to }
}

export async function loadFinance(supabase: SupabaseClient, from: Date, to: Date) {
  const args = { p_from: from.toISOString(), p_to: to.toISOString() }
  const [summary, daily] = await Promise.all([
    supabase.rpc('admin_finance_summary', args),
    supabase.rpc('admin_daily_commission', args),
  ])
  const rows = ((summary.data ?? []) as FinanceRow[]).map((r) => ({
    ...r,
    completed_count: Number(r.completed_count),
    cancelled_count: Number(r.cancelled_count),
    open_count: Number(r.open_count),
    gross: Number(r.gross),
    commission: Number(r.commission),
    partner_earnings: Number(r.partner_earnings),
  }))
  const days = ((daily.data ?? []) as DailyRow[]).map((d) => ({ ...d, commission: Number(d.commission), gross: Number(d.gross) }))
  return { rows, days, error: summary.error?.message ?? daily.error?.message ?? null }
}

export function totalsByCurrency(rows: FinanceRow[]) {
  const map = new Map<string, { gross: number; commission: number; partner: number; completed: number }>()
  for (const r of rows) {
    const t = map.get(r.currency) ?? { gross: 0, commission: 0, partner: 0, completed: 0 }
    t.gross += r.gross
    t.commission += r.commission
    t.partner += r.partner_earnings
    t.completed += r.completed_count
    map.set(r.currency, t)
  }
  return [...map.entries()].map(([currency, t]) => ({ currency, ...t })).sort((a, b) => b.gross - a.gross)
}
