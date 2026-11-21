import { Button } from '@/components/ui/button'
import { AirportFareForm, RideFareForm } from '@/components/admin/fare-forms'
import { requireAdmin } from '@/lib/session'
import { cn } from '@/lib/utils'
import { toggleAirport } from '../ride-actions'

export default async function AdminFaresPage() {
  const { supabase } = await requireAdmin()
  const [{ data: categories }, { data: fares }, { data: countries }, { data: airports }, { data: airportFares }] = await Promise.all([
    supabase.from('ride_categories').select('code, name').order('sort_order'),
    supabase.from('ride_fares').select('country_code, category_code, base_fare, per_km, per_min, min_fare, booking_fee'),
    supabase.from('countries').select('code, name, currency_code').order('name'),
    supabase.from('airports').select('id, iata, name, city, country_code, is_active').order('country_code').order('city'),
    supabase.from('airport_fares').select('airport_id, category_code, fixed_fare'),
  ])

  const catName = new Map((categories ?? []).map((c) => [c.code, c.name]))
  const order = new Map((categories ?? []).map((c, i) => [c.code, i]))

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Fares &amp; airports</h1>
        <p className="mt-1 text-muted-foreground">
          Metered prices per country and fixed airport transfer prices. Changes apply to new bookings and are recorded in the audit log.
        </p>
      </header>

      {(countries ?? []).map((c) => {
        const rows = (fares ?? [])
          .filter((f) => f.country_code === c.code)
          .sort((a, b) => (order.get(a.category_code) ?? 0) - (order.get(b.category_code) ?? 0))
        if (rows.length === 0) return null
        return (
          <section key={c.code} aria-labelledby={`fares-${c.code}`} className="rounded-xl border bg-card">
            <h2 id={`fares-${c.code}`} className="border-b px-5 py-4 font-heading text-lg font-semibold">
              {c.name} ride fares <span className="text-sm font-normal text-muted-foreground">({c.currency_code})</span>
            </h2>
            <div className="divide-y">
              {rows.map((f) => (
                <RideFareForm key={f.category_code} fare={f} label={catName.get(f.category_code) ?? f.category_code} />
              ))}
            </div>
          </section>
        )
      })}

      <section aria-labelledby="airports-heading" className="flex flex-col gap-4">
        <h2 id="airports-heading" className="font-heading text-2xl font-semibold">Airport fixed fares</h2>
        <p className="-mt-2 text-sm text-muted-foreground">Fixed prices apply to addresses within 40 km of the airport. Further trips are metered.</p>
        {(airports ?? []).map((a) => (
          <article key={a.id} className="rounded-xl border bg-card">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
              <div>
                <h3 className="font-heading font-semibold">
                  {a.iata} · {a.name}
                </h3>
                <p className="text-sm text-muted-foreground">{a.city}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', a.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                  {a.is_active ? 'Active' : 'Hidden'}
                </span>
                <form action={toggleAirport}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="enable" value={String(!a.is_active)} />
                  <Button type="submit" size="sm" variant="outline">
                    {a.is_active ? 'Hide' : 'Activate'}
                    <span className="sr-only"> {a.name}</span>
                  </Button>
                </form>
              </div>
            </header>
            <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
              {(categories ?? []).map((cat) => (
                <AirportFareForm
                  key={cat.code}
                  airportId={a.id}
                  category={cat.code}
                  label={cat.name}
                  fare={(airportFares ?? []).find((f) => f.airport_id === a.id && f.category_code === cat.code)?.fixed_fare ?? null}
                />
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
