import { CreditCard, MapPinned, Search, UserPlus } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'

const STEPS = [
  { icon: UserPlus, title: 'Create one account', body: 'Sign up with your phone or email and verify once. Your profile works across every CHALEGO service.' },
  { icon: Search, title: 'Search & compare', body: 'Pick a service, see upfront prices in GHS or NGN, and compare verified options with real reviews.' },
  { icon: CreditCard, title: 'Pay your way', body: 'Mobile money, cards, bank transfer or your CHALEGO wallet — with instant electronic receipts.' },
  { icon: MapPinned, title: 'Track in real time', body: 'Follow your driver, rider, cargo or order live, and reach support any time of day.' },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 md:px-6 md:py-28">
      <SectionHeading align="center" eyebrow="How it works" title="Four steps. Every service." />
      <ol className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <s.icon className="size-5" aria-hidden="true" />
              </span>
              <span className="font-heading text-sm font-bold text-muted-foreground">0{i + 1}</span>
            </div>
            <h3 className="text-lg font-semibold">{s.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
