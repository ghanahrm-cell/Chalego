import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Banknote, CalendarClock, ShieldCheck } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { SectionHeading } from '@/components/section-heading'
import { DIVISIONS } from '@/lib/divisions'
import { cn } from '@/lib/utils'

const DRIVER_PERKS = [
  { icon: Banknote, title: 'Weekly payouts', body: 'Cash out to mobile money or bank, with a clear earnings dashboard.' },
  { icon: CalendarClock, title: 'Your hours', body: 'Drive rides, airport runs or deliveries whenever suits you.' },
  { icon: ShieldCheck, title: 'Protected trips', body: 'Verified riders, in-app SOS and 24/7 partner support.' },
]

export function EarnSection() {
  return (
    <>
      <section id="drive" className="scroll-mt-20 bg-secondary/60">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:px-6 md:py-28 lg:grid-cols-2">
          <div className="relative order-last aspect-[4/3] overflow-hidden rounded-3xl lg:order-first">
            <Image src="/images/moto.png" alt="CHALEGO delivery rider on a motorcycle" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div>
            <SectionHeading
              eyebrow="Drive & earn"
              title="Turn your car or bike into income."
              description="Join thousands of drivers, couriers and chauffeurs earning on their own schedule across Ghana and Nigeria."
            />
            <ul className="mt-8 grid gap-5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {DRIVER_PERKS.map((p) => (
                <li key={p.title}>
                  <p.icon className="size-6 text-primary" aria-hidden="true" />
                  <h3 className="mt-2 font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/services/rides" className={cn(buttonVariants(), 'h-11 px-5')}>
                Become a driver <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </Link>
              <Link href="/services/moto-delivery" className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-5')}>
                Become a courier
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="partners" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 md:px-6 md:py-28">
        <SectionHeading
          eyebrow="Become a partner"
          title="Grow your business on CHALEGO."
          description="List vehicles, trucks, machines, rooms, apartments or menus and reach customers in two countries — with dashboards for bookings, availability and payouts."
        />
        <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-5">
          {DIVISIONS.filter((d) => d.slug !== 'rides' && d.slug !== 'airport-transfers').map((d) => (
            <li key={d.slug} className="bg-card">
              <Link href={`/services/${d.slug}#partner`} className="group flex h-full flex-col gap-2 p-5 hover:bg-muted">
                <d.icon className="size-5 text-primary" aria-hidden="true" />
                <h3 className="font-semibold">{d.partnerCta}</h3>
                <p className="text-sm text-muted-foreground">{d.partnerAudience}</p>
                <span className="mt-auto flex items-center gap-1 pt-2 text-sm font-medium text-primary">
                  Learn more <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
