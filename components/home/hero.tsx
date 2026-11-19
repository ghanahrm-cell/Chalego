import Image from 'next/image'
import { ShieldCheck, Star, Users } from 'lucide-react'
import { HeroSearch } from '@/components/home/hero-search'
import { getT } from '@/lib/i18n-server'

export async function Hero() {
  const { t } = await getT()

  return (
    <section className="relative isolate overflow-hidden bg-ink">
      <Image
        src="/images/hero.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover opacity-55"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/70 via-ink/40 to-ink" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 md:px-6 md:pb-24 md:pt-24">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-ink-foreground/20 bg-ink/40 px-3 py-1 text-xs font-medium text-ink-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
            {t('hero.badge')}
          </p>
          <h1 className="text-balance text-4xl font-bold leading-[1.05] text-ink-foreground sm:text-5xl lg:text-7xl">
            {t('hero.title1')} <span className="text-accent">{t('hero.title2')}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-ink-foreground/80 md:text-lg">
            {t('hero.body')}
          </p>
        </div>

        <div className="mt-10">
          <HeroSearch />
        </div>

        <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-foreground/80">
          <li className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-accent" aria-hidden="true" /> {t('hero.trust1')}
          </li>
          <li className="flex items-center gap-2">
            <Star className="size-4 text-accent" aria-hidden="true" /> {t('hero.trust2')}
          </li>
          <li className="flex items-center gap-2">
            <Users className="size-4 text-accent" aria-hidden="true" /> {t('hero.trust3')}
          </li>
        </ul>
      </div>
    </section>
  )
}
