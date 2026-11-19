import Link from 'next/link'
import { ArrowRight, CreditCard, MapPin, Wallet } from 'lucide-react'
import { TransactionList } from '@/components/account/transaction-list'
import { DIVISIONS } from '@/lib/divisions'
import { formatMoney, type PaymentMethod, type Transaction } from '@/lib/account'
import { requireUser } from '@/lib/session'

export default async function AccountOverviewPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { denied } = await searchParams
  const { supabase, user, profile, country } = await requireUser()
  const locale = country?.locale ?? 'en-GH'
  const currency = country?.currency_code ?? 'GHS'

  const [{ data: transactions }, { count: placeCount }, { data: methods }] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, amount, currency, division, payment_type, provider, reference, status, description, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .returns<Transaction[]>(),
    supabase.from('addresses').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase
      .from('country_payment_methods')
      .select('id, country_code, provider, display_name, is_enabled, sort_order')
      .eq('country_code', profile?.country_code ?? 'GH')
      .eq('is_enabled', true)
      .order('sort_order')
      .returns<PaymentMethod[]>(),
  ])

  const spent = (transactions ?? [])
    .filter((t) => t.status === 'success' && t.currency === currency)
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const firstName = profile?.full_name?.split(' ')[0]

  return (
    <div className="flex flex-col gap-8">
      {denied === 'admin' && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Your account does not have access to the admin console.
        </p>
      )}
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">{firstName ? `Hi, ${firstName}` : 'Your account'}</h1>
        <p className="mt-1 text-muted-foreground">Manage your bookings, payments and saved places in one place.</p>
      </header>

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <Wallet className="size-5 text-primary" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">Recent spend</p>
          <p className="font-heading text-2xl font-bold tabular-nums">{formatMoney(spent, currency, locale)}</p>
        </div>
        <Link href="/account/addresses" className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary">
          <MapPin className="size-5 text-primary" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">Saved places</p>
          <p className="font-heading text-2xl font-bold">{placeCount ?? 0}</p>
        </Link>
        <div className="rounded-xl border bg-card p-5">
          <CreditCard className="size-5 text-primary" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">Payment options in {country?.name ?? 'Ghana'}</p>
          <p className="font-heading text-2xl font-bold">{methods?.length ?? 0}</p>
        </div>
      </section>

      <section aria-labelledby="book-heading">
        <h2 id="book-heading" className="font-heading text-xl font-semibold">Book something</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {DIVISIONS.map((d) => (
            <Link
              key={d.slug}
              href={`/services/${d.slug}`}
              className="flex flex-col gap-2 rounded-xl border bg-card p-4 text-sm font-medium transition-colors hover:border-primary hover:bg-primary/5"
            >
              <d.icon className="size-5 text-primary" aria-hidden="true" />
              {d.name}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="recent-heading">
        <div className="flex items-center justify-between">
          <h2 id="recent-heading" className="font-heading text-xl font-semibold">Recent payments</h2>
          <Link href="/account/payments" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View all <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-4">
          <TransactionList transactions={transactions ?? []} locale={locale} />
        </div>
      </section>

      <section aria-labelledby="methods-heading">
        <h2 id="methods-heading" className="font-heading text-xl font-semibold">How you can pay in {country?.name ?? 'Ghana'}</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {(methods ?? []).map((m) => (
            <li key={m.id} className="rounded-full border bg-card px-4 py-2 text-sm font-medium">{m.display_name}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
