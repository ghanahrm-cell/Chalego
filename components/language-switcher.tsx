'use client'

import { Globe } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { LANGS, LANG_LABELS, type Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, pending, t } = useLanguage()

  return (
    <label className={cn('relative flex items-center', className)}>
      <span className="sr-only">{t('nav.selectLanguage')}</span>
      <Globe className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" aria-hidden="true" />
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        disabled={pending}
        className="h-8 appearance-none rounded-full border bg-muted pl-7 pr-3 text-xs font-semibold text-foreground hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        {LANGS.map((code) => (
          <option key={code} value={code}>
            {LANG_LABELS[code].short} · {LANG_LABELS[code].name}
          </option>
        ))}
      </select>
    </label>
  )
}
