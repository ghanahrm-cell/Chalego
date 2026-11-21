import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

type PaystackEvent = {
  event: string
  data: { reference?: string; id?: number; amount?: number; currency?: string; status?: string }
}

function isValidSignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false
  const expected = createHmac('sha512', secret).update(rawBody).digest('hex')
  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(signature, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return NextResponse.json({ error: 'Payments not configured' }, { status: 503 })

  const rawBody = await request.text()
  if (!isValidSignature(rawBody, request.headers.get('x-paystack-signature'), secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: PaystackEvent
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const reference = payload.data?.reference
  if (!reference || !['charge.success', 'charge.failed'].includes(payload.event)) {
    return NextResponse.json({ received: true })
  }

  const supabase = createAdminClient()
  const { data: txn } = await supabase
    .from('transactions')
    .select('id, amount, currency, status')
    .eq('reference', reference)
    .maybeSingle()

  // Unknown or already-settled references are acknowledged so Paystack stops retrying (idempotent).
  if (!txn || txn.status !== 'pending') return NextResponse.json({ received: true })

  const expectedMinor = Math.round(Number(txn.amount) * 100)
  const amountMatches = payload.data.amount === expectedMinor && payload.data.currency === txn.currency
  const status = payload.event === 'charge.success' && amountMatches ? 'success' : 'failed'

  await supabase
    .from('transactions')
    .update({ status, provider_reference: payload.data.id ? String(payload.data.id) : null })
    .eq('id', txn.id)
    .eq('status', 'pending')

  await supabase.from('audit_logs').insert({
    action: `payment_${status}`,
    entity: 'transactions',
    entity_id: txn.id,
    details: { provider: 'paystack', event: payload.event, amount_matches: amountMatches },
  })

  return NextResponse.json({ received: true })
}
