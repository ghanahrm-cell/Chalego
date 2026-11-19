import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { DIVISIONS } from '@/lib/divisions'
import { SectionHeading } from '@/components/section-heading'

export function ServicesGrid() {
  return (
    <section id="services" className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
      <SectionHeading
        eyebrow="Ten services, one account"
        title="Get around, get things moved, get settled."
        description="Every CHALEGO service shares one login, one wallet and one support team — so switching from a ride to a hotel to dinner takes seconds."
      />
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DIVISIONS.map((d, i) => (
          <li key={d.slug} className={i < 2 ? 'lg:col-span-2' : undefined}>
            <Link
              href={`/services/${d.slug}`}
              className="group relative flex h-full min-h-56 flex-col justify-end overflow-hidden rounded-2xl bg-ink p-5 text-ink-foreground"
            >
              <Image
                src={d.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 50vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover opacity-70 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" aria-hidden="true" />
              <div className="relative flex items-end justify-between gap-3">
                <div>
                  <span className="mb-3 flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <d.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-xl font-semibold">{d.name}</h3>
                  <p className="mt-1 max-w-sm text-sm text-ink-foreground/80">{d.tagline}</p>
                </div>
                <ArrowUpRight
                  className="size-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
