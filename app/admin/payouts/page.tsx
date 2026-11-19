import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/session'
import { fieldClass, formatMoney } from '@/lib/account'
import { reviewPayout } from '@/app/partner/payout-actions'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Payouts · Admin' }

type Payout = { id: string; reference: string; partner_id: string; currency: string; amount: number; method: string; destination: string; status: string; admin_note: string | null; created_at: string }

const btn = 'h-9 rounded-lg px-3 text-xs font-semibold'

export default async function AdminPayoutsPage() {
  const { supabase } = await requireAdmin()
  const { data: payouts } = await supabase
    .from('partner_payouts')
    .select('id, reference, partner_id, currency, amount, method, destination, status, admin_note, created_at')
    .order('created_at', { ascending: false })
    .limit(200)
    .returns<Payout[]>()
  const list = payouts ?? []
  const ids = [...new Set(list.map((p) => p.partner_id))]
  const { data: owners } = ids.length
    ? await supabase.from('rental_owners').select('id, business_name').in('id', ids).returns<{ id: string; business_name: string }[]>()
    : { data: [] }
  const names = new Map((owners ?? []).map((o) => [o.id, o.business_name]))
  const open = list.filter((p) => p.status === 'requested' || p.status === 'approved')
  const closed = list.filter((p) => p.status === 'paid' || p.status === 'rejected')
  const date = new Intl.DateTimeFormat('en-GH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Partner payouts</h1>
        <p className="text-sm text-muted-foreground">Approve and settle withdrawal requests from hosts, vehicle owners and restaurants.</p>
      </header>

      <section className="rounded-2xl border bg-card">
        <h2 className="border-b p-4 font-semibold">{`Open requests (${open.length})`}</h2>
        {open.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Nothing to review.</p> : (
          <ul className="divide-y">
            {open.map((p) => (
              <li key={p.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                <div className="flex-1">
                  <p className="font-medium">{`${names.get(p.partner_id) ?? 'Partner'} · ${formatMoney(Number(p.amount), p.currency)}`}</p>
                  <p className="text-sm text-muted-foreground">
                    {`${p.reference} · ${p.method === 'mobile_money' ? 'Mobile money' : 'Bank transfer'} → ${p.destination} · ${date.format(new Date(p.created_at))}`}
                  </p>
                  <p className="text-xs font-medium capitalize text-muted-foreground">{p.status}</p>
                </div>
                <form action={reviewPayout} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={p.id} />
                  <label className="sr-only" htmlFor={`note-${p.id}`}>Note</label>
                  <input id={`note-${p.id}`} name="note" placeholder="Note / transfer ref" className={cn(fieldClass, 'h-9 w-44')} />
                  {p.status === 'requested' && <button name="status" value="approved" className={cn(btn, 'bg-secondary text-secondary-foreground')}>Approve</button>}
                  <button name="status" value="paid" className={cn(btn, 'bg-primary text-primary-foreground')}>Mark paid</button>
                  <button name="status" value="rejected" className={cn(btn, 'bg-destructive/10 text-destructive')}>Reject</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border bg-card">
        <h2 className="border-b p-4 font-semibold">History</h2>
        {closed.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No settled payouts yet.</p> : (
          <ul className="divide-y text-sm">
            {closed.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <span>{`${p.reference} · ${names.get(p.partner_id) ?? 'Partner'}`}</span>
                <span className="tabular-nums">{formatMoney(Number(p.amount), p.currency)}</span>
                <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium capitalize', p.status === 'paid' ? 'bg-primary/15 text-primary' : 'bg-destructive/10 text-destructive')}>{p.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
