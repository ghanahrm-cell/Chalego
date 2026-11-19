'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, Menu, X } from 'lucide-react'
import { Logo } from '@/components/logo'
import { CountrySwitcher } from '@/components/country-switcher'
import { LanguageSwitcher } from '@/components/language-switcher'
import { HeaderAuth } from '@/components/header-auth'
import { useLanguage } from '@/components/language-provider'
import { DIVISIONS } from '@/lib/divisions'
import { divisionText, type MessageKey } from '@/lib/i18n'

const NAV_LINKS: { href: string; label: MessageKey }[] = [
  { href: '/#how-it-works', label: 'nav.howItWorks' },
  { href: '/#drive', label: 'nav.drive' },
  { href: '/#partners', label: 'nav.partners' },
  { href: '/#faq', label: 'nav.faq' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const { lang, t } = useLanguage()

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        {t('nav.skip')}
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground focus-visible:text-foreground"
              aria-haspopup="true"
            >
              {t('nav.services')} <ChevronDown className="size-4" aria-hidden="true" />
            </button>
            <div className="invisible absolute left-0 top-full w-[34rem] pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <ul className="grid grid-cols-2 gap-1 rounded-xl border bg-popover p-2 shadow-lg">
                {DIVISIONS.map((d) => (
                  <li key={d.slug}>
                    <Link
                      href={`/services/${d.slug}`}
                      className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted focus-visible:bg-muted"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                        <d.icon className="size-4" aria-hidden="true" />
                      </span>
                      <span className="text-sm font-medium">{divisionText(lang, d.slug, 'name', d.name)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground"
            >
              {t(l.label)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <CountrySwitcher />
          <LanguageSwitcher />
          <HeaderAuth />
        </div>

        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-md lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          <span className="sr-only">{open ? t('nav.closeMenu') : t('nav.openMenu')}</span>
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t bg-background lg:hidden">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('nav.services')}</p>
            <ul className="grid grid-cols-2 gap-1">
              {DIVISIONS.map((d) => (
                <li key={d.slug}>
                  <Link
                    href={`/services/${d.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-muted"
                  >
                    <d.icon className="size-4 text-primary" aria-hidden="true" />
                    {divisionText(lang, d.slug, 'name', d.name)}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="mt-4 flex flex-col border-t pt-4">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={() => setOpen(false)} className="block rounded-md px-2 py-2 text-sm font-medium hover:bg-muted">
                    {t(l.label)}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
              <div className="flex items-center gap-2">
                <CountrySwitcher />
                <LanguageSwitcher />
              </div>
              <HeaderAuth onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
