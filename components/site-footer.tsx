import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'
import { Logo } from '@/components/logo'
import { DIVISIONS } from '@/lib/divisions'
import { EXPANSION_MARKETS } from '@/lib/countries'

const COMPANY = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#drive', label: 'Become a driver' },
  { href: '/#partners', label: 'Become a partner' },
  { href: '/#faq', label: 'Help & FAQ' },
]

const SOCIALS = ['Facebook', 'Instagram', 'X', 'LinkedIn', 'TikTok']

export function SiteFooter() {
  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:px-6 lg:grid-cols-4">
        <div className="flex flex-col gap-4">
          <Logo inverted />
          <p className="max-w-xs text-sm leading-relaxed text-ink-foreground/70">
            {"Africa's all-in-one mobility, travel, logistics and lifestyle platform. One account for everything you need."}
          </p>
          <ul className="flex flex-col gap-2 text-sm text-ink-foreground/80">
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-accent" aria-hidden="true" /> Accra, Ghana · Lagos, Nigeria
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4 text-accent" aria-hidden="true" /> +233 30 000 0000 · +234 1 000 0000
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4 text-accent" aria-hidden="true" />
              <a href="mailto:hello@chalego.com" className="hover:text-accent">hello@chalego.com</a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent">Services</h2>
          <ul className="grid grid-cols-1 gap-2 text-sm">
            {DIVISIONS.map((d) => (
              <li key={d.slug}>
                <Link href={`/services/${d.slug}`} className="text-ink-foreground/75 hover:text-ink-foreground">
                  {d.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent">Company</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {COMPANY.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-ink-foreground/75 hover:text-ink-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-accent">Follow us</h2>
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
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent">Where we operate</h2>
          <p className="text-sm text-ink-foreground/80">
            <span className="font-semibold text-ink-foreground">Live:</span> Ghana (GHS) · Nigeria (NGN)
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-foreground/70">
            <span className="font-semibold text-ink-foreground">Coming soon:</span> {EXPANSION_MARKETS.join(', ')}.
          </p>
        </div>
      </div>
      <div className="border-t border-ink-foreground/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-ink-foreground/60 md:flex-row md:items-center md:justify-between md:px-6">
          <p>© {new Date().getFullYear()} CHALEGO. All rights reserved.</p>
          <ul className="flex gap-4">
            <li><a href="#" className="hover:text-ink-foreground">Terms</a></li>
            <li><a href="#" className="hover:text-ink-foreground">Privacy</a></li>
            <li><a href="#" className="hover:text-ink-foreground">Cookies</a></li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
