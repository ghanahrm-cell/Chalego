import { MapPin, Star, Trash2 } from 'lucide-react'
import { AddressForm } from '@/components/account/address-form'
import { Button } from '@/components/ui/button'
import type { Address, CountryRow } from '@/lib/account'
import { requireUser } from '@/lib/session'
import { deleteAddress, setDefaultAddress } from '../actions'

export const metadata = { title: 'Saved places | CHALEGO' }

export default async function AddressesPage() {
  const { supabase, user, profile } = await requireUser('/account/addresses')
  const [{ data: addresses }, { data: countries }] = await Promise.all([
    supabase
      .from('addresses')
      .select('id, label, line1, city, country_code, is_default')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
      .returns<Address[]>(),
    supabase
      .from('countries')
      .select('code, name, currency_code, locale, dial_code, timezone, commission_rate, tax_rate, is_active')
      .eq('is_active', true)
      .order('name')
      .returns<CountryRow[]>(),
  ])
  const countryName = new Map((countries ?? []).map((c) => [c.code, c.name]))

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Saved places</h1>
        <p className="mt-1 text-muted-foreground">Save pickup and delivery spots for faster booking.</p>
      </header>

      {addresses && addresses.length > 0 ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="flex flex-col gap-3 rounded-xl border bg-card p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    {a.label}
                    {a.is_default && (
                      <span className="rounded-full bg-secondary/25 px-2 py-0.5 text-xs font-medium">Default</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{a.line1}</p>
                  <p className="text-sm text-muted-foreground">
                    {a.city}, {countryName.get(a.country_code) ?? a.country_code}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {!a.is_default && (
                  <form action={setDefaultAddress}>
                    <input type="hidden" name="id" value={a.id} />
                    <Button type="submit" variant="outline" size="sm">
                      <Star className="size-3.5" aria-hidden="true" />
                      Set default
                    </Button>
                  </form>
                )}
                <form action={deleteAddress}>
                  <input type="hidden" name="id" value={a.id} />
                  <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Remove<span className="sr-only"> {a.label}</span>
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed bg-card px-6 py-8 text-center text-sm text-muted-foreground">
          No saved places yet. Add your home or office below.
        </p>
      )}

      <AddressForm countries={countries ?? []} defaultCountry={profile?.country_code ?? 'GH'} />
    </div>
  )
}
