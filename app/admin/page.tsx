import { CheckCircle2, Clock, Globe2, Users } from 'lucide-react'
import { requireAdmin } from '@/lib/session'

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdmin()

  const [users, activeCountries, pending, succeeded] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('countries').select('code', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('status', 'success'),
  ])

  const stats = [
    { label: 'Registered users', value: users.count ?? 0, icon: Users },
    { label: 'Active countries', value: activeCountries.count ?? 0, icon: Globe2 },
    { label: 'Pending payments', value: pending.count ?? 0, icon: Clock },
    { label: 'Successful payments', value: succeeded.count ?? 0, icon: CheckCircle2 },
  ]

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Platform overview</h1>
        <p className="mt-1 text-muted-foreground">Live counts across every country and division.</p>
      </header>
      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border bg-card p-5">
            <Icon className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">{label}</p>
            <p className="font-heading text-3xl font-bold tabular-nums">{value.toLocaleString()}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
