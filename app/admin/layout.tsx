import type { ReactNode } from 'react'
import { AdminNav } from '@/components/admin/admin-nav'
import { requireAdmin } from '@/lib/session'

export const metadata = { title: 'Admin console | CHALEGO', robots: { index: false } }

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireAdmin()

  return (
    <main id="main" className="flex min-h-[calc(100dvh-4rem)] flex-col lg:flex-row">
      <aside className="flex flex-col gap-6 bg-primary p-4 text-primary-foreground lg:w-64 lg:shrink-0 lg:p-6">
        <div>
          <p className="font-heading text-lg font-bold">Admin console</p>
          <p className="text-sm capitalize text-primary-foreground/70">{profile?.role?.replace('_', ' ')}</p>
        </div>
        <AdminNav />
      </aside>
      <div className="min-w-0 flex-1 px-4 py-8 md:px-8 lg:py-10">{children}</div>
    </main>
  )
}
