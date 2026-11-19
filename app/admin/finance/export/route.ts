import type { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { DIVISION_LABELS, loadFinance, resolveRange } from '@/lib/admin-reports'

function cell(v: string | number) {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(req: NextRequest) {
  const { supabase } = await requireAdmin()
  const { value, from, to } = resolveRange(req.nextUrl.searchParams.get('range') ?? undefined)
  const { rows, days, error } = await loadFinance(supabase, from, to)
  if (error) return new Response(error, { status: 500 })

  const lines = [
    ['Section', 'Division', 'Day', 'Currency', 'Completed', 'Open', 'Cancelled', 'Gross', 'Commission', 'Partner earnings'],
    ...rows.map((r) => [
      'summary', DIVISION_LABELS[r.division] ?? r.division, '', r.currency,
      r.completed_count, r.open_count, r.cancelled_count, r.gross.toFixed(2), r.commission.toFixed(2), r.partner_earnings.toFixed(2),
    ]),
    ...days.map((d) => ['daily', '', d.day, d.currency, '', '', '', d.gross.toFixed(2), d.commission.toFixed(2), '']),
  ]
  const csv = lines.map((l) => l.map(cell).join(',')).join('\n')
  const stamp = to.toISOString().slice(0, 10)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="chalego-finance-${value}d-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
