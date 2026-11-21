import type { Metadata } from 'next'
import Link from 'next/link'
import { BedDouble, Car, UtensilsCrossed, ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { PayoutForm } from '@/components/partner/payout-form'
import { requireUser } from '@/lib/session'
import { formatMoney } from '@/lib/account'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Partner hub', robots: { index: false } }

type Earning = { division: 'rentals' | 'stays' | 'food'; currency: string; completed_count: number; gross: number; commission: number; earnings: number; pending_count: number }
type Balance = { currency: string; earned: number; paid_out: number; pending_payout: number; available: number }
type Payout = { id: string; reference: string; currency: string; amount: number; method: string; destination: string; status: string; admin_note: string | null; created_at: string }

const DIVISIONS = [
  { key: 'rentals', label: 'Car rentals', href: '/partner/rentals', icon: Car },
  { key: 'stays', label: 'Stays', href: '/partner/stays', icon: BedDouble },
  { key: 'food', label: 'Restaurants', href: '/partner/food', icon: UtensilsCrossed },
] as const

const PAYOUT_STYLES: Record<string, string> = {
  requested: 'bg-accent/20 text-foreground',
  approved: 'bg-secondary text-secondary-foreground',
  paid: 'bg-primary/15 text-primary',
  rejected: 'bg-destructive/10 text-destructive',
}

export default async function PartnerHubPage() {
  const { supabase, user, country } = await requireUser('/partner')
  const locale = country?.locale ?? 'en-GH'
  const { data: owner } = await supabase.from('rental_owners').select('business_name, status').eq('id', user.id).maybeSingle<{ business_name: string; status: string }>()

  if (owner?.status !== 'approved') {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Grow your business with CHALEGO</h1>
        <p className="text-muted-foreground">
          One verified partner account lets you list vehicles, host stays and run a restaurant, with earnings and payouts in one place.
        </p>
        {owner?.status === 'pending' ? (
          <p role="status" className="rounded-lg bg-accent/15 px-4 py-3 text-sm">Your partner application is under review. We usually respond within 2 business days.</p>
        ) : (
          <Link href="/partner/rentals" className={cn(buttonVariants(), 'h-11 w-fit px-5')}>
            {owner ? 'Review your partner application' : 'Apply to become a partner'}
          </Link>
        )}
      </div>
    )
  }

  const [earningsRes, balancesRes, { data: payouts }] = await Promise.all([
    supabase.rpc('partner_earnings'),
    supabase.rpc('partner_balances'),
    supabase.from('partner_payouts').select('id, reference, currency, amount, method, destination, status, admin_note, created_at').eq('partner_id', user.id).order('created_at', { ascending: false }).limit(50).returns<Payout[]>(),
  ])
  const rows = (earningsRes.data ?? []) as Earning[]
  const balances = (balancesRes.data ?? []) as Balance[]
  const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' })
  const money = (n: number, c: string) => formatMoney(Number(n), c, locale)

  return (
    <div className="flex flex-col gap-10">
      <header>
        <p className="text-sm text-muted-foreground">Partner hub</p>
        <h1 className="font-heading text-3xl font-bold tracking-tight">{owner.business_name}</h1>
      </header>

      <section aria-labelledby="balance-h" className="flex flex-col gap-4">
        <h2 id="balance-h" className="font-heading text-xl font-semibold">Wallet</h2>
        {(balances ?? []).length === 0 ? (
          <p className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">No earnings yet. Completed bookings and orders appear here.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {(balances ?? []).map((b) => (
              <div key={b.currency} className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{`Available · ${b.currency}`}</p>
                  <p className="font-heading text-3xl font-bold tabular-nums">{money(b.available, b.currency)}</p>
                </div>
                <dl className="grid grid-cols-3 gap-3 text-sm">
                  <div><dt className="text-muted-foreground">Earned</dt><dd className="font-medium tabular-nums">{money(b.earned, b.currency)}</dd></div>
                  <div><dt className="text-muted-foreground">Pending</dt><dd className="font-medium tabular-nums">{money(b.pending_payout, b.currency)}</dd></div>
                  <div><dt className="text-muted-foreground">Paid out</dt><dd className="font-medium tabular-nums">{money(b.paid_out, b.currency)}</dd></div>
                </dl>
              </div>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="div-h" className="flex flex-col gap-4">
        <h2 id="div-h" className="font-heading text-xl font-semibold">Performance by division</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {DIVISIONS.map(({ key, label, href, icon: Icon }) => {
            const d = rows.filter((r) => r.division === key)
            const completed = d.reduce((s, r) => s + Number(r.completed_count), 0)
            const active = d.reduce((s, r) => s + Number(r.pending_count), 0)
            return (
              <div key={key} className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" aria-hidden="true" /></span>
                  <h3 className="font-semibold">{label}</h3>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-muted-foreground">Completed</dt><dd className="text-lg font-semibold tabular-nums">{completed}</dd></div>
                  <div><dt className="text-muted-foreground">In progress</dt><dd className="text-lg font-semibold tabular-nums">{active}</dd></div>
                </dl>
                {d.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                ) : (
                  <ul className="flex flex-col gap-2 text-sm">
                    {d.map((r) => (
                      <li key={r.currency} className="flex flex-col gap-0.5 rounded-lg bg-muted/60 px-3 py-2">
                        <span className="flex justify-between"><span className="text-muted-foreground">Gross</span><span className="tabular-nums">{money(r.gross, r.currency)}</span></span>
                        <span className="flex justify-between"><span className="text-muted-foreground">Commission</span><span className="tabular-nums">{`-${money(r.commission, r.currency)}`}</span></span>
                        <span className="flex justify-between font-medium"><span>Your earnings</span><span className="tabular-nums">{money(r.earnings, r.currency)}</span></span>
                      </li>
                    ))}
                  </ul>
                )}
                <Link href={href} className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  Manage {label.toLowerCase()} <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="payout-h" className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
        <h2 id="payout-h" className="font-heading text-xl font-semibold">Request a payout</h2>
        <PayoutForm balances={(balances ?? []).map((b) => ({ currency: b.currency, available: Number(b.available), label: money(b.available, b.currency) }))} />
      </section>

      <section aria-labelledby="hist-h" className="flex flex-col gap-4">
        <h2 id="hist-h" className="font-heading text-xl font-semibold">Payout history</h2>
        {(payouts ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No payout requests yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b">
                  <th scope="col" className="px-4 py-3 font-medium">Reference</th>
                  <th scope="col" className="px-4 py-3 font-medium">Date</th>
                  <th scope="col" className="px-4 py-3 font-medium">Method</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(payouts ?? []).map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-mono text-xs">{p.reference}</td>
                    <td className="px-4 py-3">{date.format(new Date(p.created_at))}</td>
                    <td className="px-4 py-3">{p.method === 'mobile_money' ? 'Mobile money' : 'Bank transfer'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{money(p.amount, p.currency)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium capitalize', PAYOUT_STYLES[p.status])}>{p.status}</span>
                      {p.admin_note && <p className="mt-1 text-xs text-muted-foreground">{p.admin_note}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
