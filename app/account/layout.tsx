import type { ReactNode } from 'react'
import { LogOut } from 'lucide-react'
import { AccountNav } from '@/components/account/account-nav'
import { Button } from '@/components/ui/button'
import { isAdminRole } from '@/lib/account'
import { requireUser } from '@/lib/session'
import { signOut } from './actions'

export const metadata = { title: 'My account | CHALEGO', robots: { index: false } }

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const { user, profile, country } = await requireUser()
  const name = profile?.full_name || user.email

  return (
    <main id="main" className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:py-12">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="flex flex-col gap-6 lg:w-60 lg:shrink-0">
          <div className="rounded-xl border bg-card p-4">
            <p className="truncate font-heading font-semibold">{name}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            <p className="mt-3 inline-flex rounded-full bg-secondary/20 px-2.5 py-0.5 text-xs font-medium text-foreground">
              {country?.name ?? 'Ghana'} · {country?.currency_code ?? 'GHS'}
            </p>
          </div>
          <AccountNav isAdmin={isAdminRole(profile?.role)} />
          <form action={signOut} className="hidden lg:block">
            <Button type="submit" variant="ghost" className="w-full justify-start text-muted-foreground">
              <LogOut className="size-4" aria-hidden="true" />
              Log out
            </Button>
          </form>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <form action={signOut} className="mt-8 lg:hidden">
        <Button type="submit" variant="outline" className="w-full">
          <LogOut className="size-4" aria-hidden="true" />
          Log out
        </Button>
      </form>
    </main>
  )
}
