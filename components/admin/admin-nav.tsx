'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, Car, CreditCard, Globe2, IdCard, KeyRound, LayoutDashboard, ScrollText, Tags } from 'lucide-react'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/rides', label: 'Rides', icon: Car },
  { href: '/admin/drivers', label: 'Drivers', icon: IdCard },
  { href: '/admin/rentals', label: 'Rentals', icon: KeyRound },
  { href: '/admin/fares', label: 'Fares & airports', icon: Tags },
  { href: '/admin/countries', label: 'Countries', icon: Globe2 },
  { href: '/admin/payment-methods', label: 'Payment methods', icon: CreditCard },
  { href: '/admin/audit', label: 'Audit log', icon: ScrollText },
]

export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'bg-primary-foreground text-primary' : 'text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        )
      })}
      <Link
        href="/account"
        className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground lg:mt-4"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to my account
      </Link>
    </nav>
  )
}
