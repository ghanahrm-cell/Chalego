import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { SectionHeading } from '@/components/section-heading'
import { cn } from '@/lib/utils'

const AIRPORTS = [
  { code: 'ACC', name: 'Kotoka International', city: 'Accra' },
  { code: 'LOS', name: 'Murtala Muhammed', city: 'Lagos' },
  { code: 'ABV', name: 'Nnamdi Azikiwe', city: 'Abuja' },
]

const PERKS = ['Flight-aware pickup — we wait if you land late', 'Meet-and-greet in arrivals', 'Fixed prices, no surge on arrival', 'VIP, corporate and group vehicles']

export function AirportSection() {
  return (
    <section className="bg-ink">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:px-6 md:py-28 lg:grid-cols-2">
        <div>
          <SectionHeading
            inverted
            eyebrow="Airport transfers"
            title="Land. Breathe. Your driver is already there."
            description="Pre-book pickups and drop-offs at West Africa's busiest airports with a chauffeur who tracks your flight."
          />
          <ul className="mt-8 flex flex-col gap-3">
            {PERKS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-ink-foreground/85">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Check className="size-3" aria-hidden="true" />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <ul className="mt-8 grid grid-cols-3 gap-3">
            {AIRPORTS.map((a) => (
              <li key={a.code} className="rounded-xl border border-ink-foreground/15 p-3">
                <p className="font-heading text-2xl font-bold text-accent">{a.code}</p>
                <p className="mt-1 text-xs leading-snug text-ink-foreground/70">
                  {a.name}, {a.city}
                </p>
              </li>
            ))}
          </ul>
          <Link
            href="/services/airport-transfers"
            className={cn(buttonVariants(), 'mt-8 h-11 bg-accent px-5 text-accent-foreground [a]:hover:bg-accent/85')}
          >
            Book an airport transfer <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl lg:aspect-[5/4]">
          <Image
            src="/images/airport.png"
            alt="Chauffeur loading luggage into an executive sedan outside an airport terminal"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}
