import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Check, ChevronRight } from 'lucide-react'
import { BookingForm } from '@/components/booking-form'
import { SectionHeading } from '@/components/section-heading'
import { buttonVariants } from '@/components/ui/button'
import { DIVISIONS, getDivision } from '@/lib/divisions'
import { cn } from '@/lib/utils'

export function generateStaticParams() {
  return DIVISIONS.map((d) => ({ slug: d.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const division = getDivision(slug)
  if (!division) return {}
  return { title: division.name, description: `${division.tagline} ${division.description}` }
}

export default async function DivisionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const division = getDivision(slug)
  if (!division) notFound()

  const others = DIVISIONS.filter((d) => d.slug !== division.slug).slice(0, 4)

  return (
    <>
      <section className="relative isolate overflow-hidden bg-ink">
        <Image src={division.image} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-45" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/80 to-ink/30" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-[1fr_28rem] lg:items-center">
          <div>
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center gap-1 text-sm text-ink-foreground/70">
                <li><Link href="/" className="hover:text-ink-foreground">Home</Link></li>
                <li aria-hidden="true"><ChevronRight className="size-3.5" /></li>
                <li><Link href="/#services" className="hover:text-ink-foreground">Services</Link></li>
                <li aria-hidden="true"><ChevronRight className="size-3.5" /></li>
                <li aria-current="page" className="text-ink-foreground">{division.name}</li>
              </ol>
            </nav>
            <span className="mb-5 flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <division.icon className="size-6" aria-hidden="true" />
            </span>
            <h1 className="text-4xl font-bold text-ink-foreground md:text-6xl">{division.name}</h1>
            <p className="mt-4 max-w-xl text-pretty text-lg text-ink-foreground/85">{division.tagline}</p>
            <p className="mt-3 max-w-xl text-pretty leading-relaxed text-ink-foreground/70">{division.description}</p>
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-2xl md:p-6">
            <h2 className="mb-4 text-lg font-semibold">Start a {division.shortName.toLowerCase()} search</h2>
            <BookingForm slug={division.slug} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <SectionHeading eyebrow={division.categoriesLabel} title={`Every option, one ${division.shortName.toLowerCase()} marketplace`} />
        <ul className="mt-8 flex flex-wrap gap-2">
          {division.categories.map((c) => (
            <li key={c} className="rounded-full border bg-card px-4 py-2 text-sm font-medium">{c}</li>
          ))}
        </ul>
      </section>

      <section className="bg-secondary/60">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <SectionHeading eyebrow="Built in" title="Features that make it effortless" />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {division.features.map((f) => (
              <li key={f} className="flex items-start gap-3 rounded-xl border bg-card p-4">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3.5" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="partner" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 md:px-6 md:py-24">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-primary p-8 text-primary-foreground md:flex-row md:items-center md:p-12">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">For partners</p>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">{division.partnerCta}</h2>
            <p className="mt-3 text-primary-foreground/80">
              Built for {division.partnerAudience.toLowerCase()}. Manage listings, availability, bookings and payouts from
              your CHALEGO partner dashboard.
            </p>
          </div>
          <Link href="/#app" className={cn(buttonVariants(), 'h-11 shrink-0 bg-accent px-5 text-accent-foreground [a]:hover:bg-accent/85')}>
            Apply to join <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-6 md:pb-28">
        <h2 className="text-2xl font-bold">Explore more CHALEGO services</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((d) => (
            <li key={d.slug}>
              <Link href={`/services/${d.slug}`} className="group flex h-full items-center gap-3 rounded-xl border bg-card p-4 hover:border-primary">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <d.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="font-medium">{d.name}</span>
                <ArrowRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
