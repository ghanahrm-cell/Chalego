import Link from 'next/link'
import { ArrowRight, Car, CheckCircle2, Clock, Globe2, Hotel, KeyRound, Package, Users, UtensilsCrossed, Wallet } from 'lucide-react'
import { requireAdmin } from '@/lib/session'
import { formatMoney } from '@/lib/account'
import { DIVISION_LABELS, loadFinance, totalsByCurrency } from '@/lib/admin-reports'

const DIVISION_ICONS = { rides: Car, deliveries: Package, rentals: KeyRound, stays: Hotel, food: UtensilsCrossed } as const

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdmin()
  const to = new Date()
  const from = new Date(to.getTime() - 30 * 86_400_000)

  const [users, activeCountries, pending, succeeded, payouts, finance] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('countries').select('code', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('status', 'success'),
    supabase.from('partner_payouts').select('id', { count: 'exact', head: true }).in('status', ['requested', 'approved']),
    loadFinance(supabase, from, to),
  ])

  const stats = [
    { label: 'Registered users', value: users.count ?? 0, icon: Users, href: '/admin/users' },
    { label: 'Active countries', value: activeCountries.count ?? 0, icon: Globe2, href: '/admin/countries' },
    { label: 'Pending payments', value: pending.count ?? 0, icon: Clock, href: '/admin/audit' },
    { label: 'Successful payments', value: succeeded.count ?? 0, icon: CheckCircle2, href: '/admin/audit' },
    { label: 'Open payout requests', value: payouts.count ?? 0, icon: Wallet, href: '/admin/payouts' },
  ]

  const totals = totalsByCurrency(finance.rows)
  const divisions = Object.keys(DIVISION_LABELS).map((d) => {
    const rows = finance.rows.filter((r) => r.division === d)
    return {
      key: d as keyof typeof DIVISION_ICONS,
      completed: rows.reduce((s, r) => s + r.completed_count, 0),
      open: rows.reduce((s, r) => s + r.open_count, 0),
    }
  })

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Platform overview</h1>
        <p className="mt-1 text-muted-foreground">Live activity across every country and division.</p>
      </header>

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="rounded-xl border bg-card p-5 transition-colors hover:border-primary/40">
            <Icon className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">{label}</p>
            <p className="font-heading text-3xl font-bold tabular-nums">{value.toLocaleString()}</p>
          </Link>
        ))}
      </section>

      <section aria-labelledby="commission-30" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 id="commission-30" className="font-heading text-lg font-semibold">Commission · last 30 days</h2>
          <Link href="/admin/finance" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Full report <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        {totals.length === 0 ? (
          <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">No completed activity in the last 30 days.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {totals.map((t) => (
              <div key={t.currency} className="rounded-xl border bg-card p-5">
                <p className="text-sm text-muted-foreground">{t.currency}</p>
                <p className="font-heading text-2xl font-bold tabular-nums text-primary">{formatMoney(t.commission, t.currency)}</p>
                <p className="mt-1 text-xs text-muted-foreground">on {formatMoney(t.gross, t.currency)} gross volume</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="divisions-30" className="flex flex-col gap-3">
        <h2 id="divisions-30" className="font-heading text-lg font-semibold">Divisions · last 30 days</h2>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {divisions.map(({ key, completed, open }) => {
            const Icon = DIVISION_ICONS[key]
            return (
              <li key={key} className="flex flex-col gap-2 rounded-xl border bg-card p-5">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                  <p className="font-medium">{DIVISION_LABELS[key]}</p>
                </div>
                <dl className="flex gap-6 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Completed</dt>
                    <dd className="font-heading text-xl font-bold tabular-nums">{completed.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">In progress</dt>
                    <dd className="font-heading text-xl font-bold tabular-nums">{open.toLocaleString()}</dd>
                  </div>
                </dl>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
