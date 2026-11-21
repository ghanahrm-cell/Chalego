import { Button } from '@/components/ui/button'
import type { PaymentMethod } from '@/lib/account'
import { requireAdmin } from '@/lib/session'
import { cn } from '@/lib/utils'
import { togglePaymentMethod } from '../actions'

export default async function AdminPaymentMethodsPage() {
  const { supabase } = await requireAdmin()
  const [{ data: methods }, { data: countries }] = await Promise.all([
    supabase
      .from('country_payment_methods')
      .select('id, country_code, provider, display_name, is_enabled, sort_order')
      .order('country_code')
      .order('sort_order')
      .returns<PaymentMethod[]>(),
    supabase.from('countries').select('code, name').order('name'),
  ])

  const grouped = new Map<string, PaymentMethod[]>()
  for (const m of methods ?? []) grouped.set(m.country_code, [...(grouped.get(m.country_code) ?? []), m])

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Payment methods</h1>
        <p className="mt-1 text-muted-foreground">Choose which payment options customers see in each country.</p>
      </header>
      {(countries ?? [])
        .filter((c) => grouped.has(c.code))
        .map((c) => (
          <section key={c.code} aria-labelledby={`pm-${c.code}`} className="rounded-xl border bg-card">
            <h2 id={`pm-${c.code}`} className="border-b px-5 py-4 font-heading text-lg font-semibold">{c.name}</h2>
            <ul className="divide-y">
              {grouped.get(c.code)!.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div>
                    <p className="font-medium">{m.display_name}</p>
                    <p className="text-xs text-muted-foreground">{m.provider}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        m.is_enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {m.is_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <form action={togglePaymentMethod}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="enable" value={String(!m.is_enabled)} />
                      <Button type="submit" size="sm" variant="outline">
                        {m.is_enabled ? 'Disable' : 'Enable'}
                        <span className="sr-only"> {m.display_name} in {c.name}</span>
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  )
}
