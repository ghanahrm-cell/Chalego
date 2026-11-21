import { NextResponse } from 'next/server'
import { isAdminRole } from '@/lib/account'
import { getSessionProfile } from '@/lib/session'
import { createAdminClient } from '@/lib/supabase/admin'

const COLUMNS = ['created_at', 'paid_at', 'reference', 'status', 'currency', 'amount', 'refunded_amount', 'division', 'booking_kind', 'booking_ref', 'customer_email', 'stripe_payment_intent', 'failure_reason'] as const

function csvCell(value: unknown) {
  const s = value == null ? '' : String(value)
  // Prefix formula-leading cells so spreadsheets do not execute them.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export async function GET(request: Request) {
  const session = await getSessionProfile()
  if (!session || !isAdminRole(session.profile?.role)) return NextResponse.json({ error: 'Not authorised' }, { status: 403 })

  const status = new URL(request.url).searchParams.get('status')
  let query = createAdminClient().from('transactions').select(COLUMNS.join(', ')).eq('provider', 'stripe').order('created_at', { ascending: false }).limit(5000)
  if (status && ['pending', 'success', 'failed', 'refunded', 'cancelled'].includes(status)) query = query.eq('status', status)

  const { data, error } = await query.returns<Record<string, unknown>[]>()
  if (error) return NextResponse.json({ error: 'Export failed' }, { status: 500 })

  const body = [COLUMNS.join(','), ...(data ?? []).map((row) => COLUMNS.map((c) => csvCell(row[c])).join(','))].join('\n')
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="chalego-stripe-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
