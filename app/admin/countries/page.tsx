import { CountryForm } from '@/components/admin/country-form'
import type { CountryRow } from '@/lib/account'
import { requireAdmin } from '@/lib/session'

export default async function AdminCountriesPage() {
  const { supabase } = await requireAdmin()
  const { data: countries } = await supabase
    .from('countries')
    .select('code, name, currency_code, locale, dial_code, timezone, commission_rate, tax_rate, is_active')
    .order('is_active', { ascending: false })
    .order('name')
    .returns<CountryRow[]>()

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Countries</h1>
        <p className="mt-1 text-muted-foreground text-pretty">
          Launch new markets and set commission and tax rates. Every change is recorded in the audit log.
        </p>
      </header>
      <div className="grid gap-4 xl:grid-cols-2">
        {(countries ?? []).map((c) => (
          <CountryForm key={c.code} country={c} />
        ))}
      </div>
    </div>
  )
}
