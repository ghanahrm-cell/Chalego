import { ProfileForm } from '@/components/account/profile-form'
import type { CountryRow } from '@/lib/account'
import { requireUser } from '@/lib/session'

export const metadata = { title: 'Profile | CHALEGO' }

export default async function ProfilePage() {
  const { supabase, user, profile } = await requireUser('/account/profile')
  const { data: countries } = await supabase
    .from('countries')
    .select('code, name, currency_code, locale, dial_code, timezone, commission_rate, tax_rate, is_active')
    .eq('is_active', true)
    .order('name')
    .returns<CountryRow[]>()

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-muted-foreground">Your details are shared only with drivers and partners you book with.</p>
      </header>
      <ProfileForm profile={profile} email={user.email ?? ''} countries={countries ?? []} />
    </div>
  )
}
