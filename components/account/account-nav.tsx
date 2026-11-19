'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MapPin, ReceiptText, ShieldCheck, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/account', label: 'Overview', icon: LayoutDashboard },
  { href: '/account/profile', label: 'Profile', icon: UserRound },
  { href: '/account/addresses', label: 'Saved places', icon: MapPin },
  { href: '/account/payments', label: 'Payments', icon: ReceiptText },
]

export function AccountNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const links = isAdmin ? [...LINKS, { href: '/admin', label: 'Admin console', icon: ShieldCheck }] : LINKS

  return (
    <nav aria-label="Account" className="flex gap-1 overflow-x-auto lg:flex-col">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
