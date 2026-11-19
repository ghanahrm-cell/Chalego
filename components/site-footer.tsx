import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'
import { Logo } from '@/components/logo'
import { DIVISIONS } from '@/lib/divisions'
import { EXPANSION_MARKETS } from '@/lib/countries'
import { COUNTRY_NAMES, divisionText, type MessageKey } from '@/lib/i18n'
import { getT } from '@/lib/i18n-server'

const COMPANY: { href: string; label: MessageKey }[] = [
  { href: '/#how-it-works', label: 'footer.howItWorks' },
  { href: '/#drive', label: 'footer.driver' },
  { href: '/#partners', label: 'footer.partner' },
  { href: '/#faq', label: 'footer.help' },
]

const SOCIALS = ['Facebook', 'Instagram', 'X', 'LinkedIn', 'TikTok']

export async function SiteFooter() {
  const { lang, t } = await getT()
  const names = COUNTRY_NAMES[lang]

  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:px-6 lg:grid-cols-4">
        <div className="flex flex-col gap-4">
          <Logo inverted />
          <p className="max-w-xs text-sm leading-relaxed text-ink-foreground/70">{t('footer.about')}</p>
          <ul className="flex flex-col gap-2 text-sm text-ink-foreground/80">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" /> Accra · Lagos · Abidjan
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" /> +233 30 000 0000 · +234 1 000 0000 · +225 27 00 00 00 00
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4 text-accent" aria-hidden="true" />
              <a href="mailto:hello@chalego.com" className="hover:text-accent">hello@chalego.com</a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent">{t('footer.services')}</h2>
          <ul className="grid grid-cols-1 gap-2 text-sm">
            {DIVISIONS.map((d) => (
              <li key={d.slug}>
                <Link href={`/services/${d.slug}`} className="text-ink-foreground/75 hover:text-ink-foreground">
                  {divisionText(lang, d.slug, 'name', d.name)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent">{t('footer.company')}</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {COMPANY.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-ink-foreground/75 hover:text-ink-foreground">
                  {t(l.label)}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-accent">{t('footer.follow')}</h2>
          <ul className="flex flex-wrap gap-2">
            {SOCIALS.map((s) => (
              <li key={s}>
                <a
                  href="#"
                  className="rounded-full border border-ink-foreground/20 px-3 py-1 text-xs text-ink-foreground/80 hover:border-accent hover:text-accent"
                >
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent">{t('footer.where')}</h2>
          <p className="text-sm leading-relaxed text-ink-foreground/80">
            <span className="font-semibold text-ink-foreground">{t('footer.live')}</span> {names.GH} (GHS) · {names.NG} (NGN) · {names.CI} (XOF)
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-foreground/70">
            <span className="font-semibold text-ink-foreground">{t('footer.soon')}</span> {EXPANSION_MARKETS.join(', ')}.
          </p>
        </div>
      </div>
      <div className="border-t border-ink-foreground/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-ink-foreground/60 md:flex-row md:items-center md:justify-between md:px-6">
          <p>© {new Date().getFullYear()} CHALEGO. {t('footer.rights')}</p>
          <ul className="flex gap-4">
            <li><a href="#" className="hover:text-ink-foreground">{t('footer.terms')}</a></li>
            <li><a href="#" className="hover:text-ink-foreground">{t('footer.privacy')}</a></li>
            <li><a href="#" className="hover:text-ink-foreground">{t('footer.cookies')}</a></li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
