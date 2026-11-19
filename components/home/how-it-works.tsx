import { CreditCard, MapPinned, Search, UserPlus } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import type { MessageKey } from '@/lib/i18n'
import { getT } from '@/lib/i18n-server'

const STEPS: { icon: typeof UserPlus; key: 's1' | 's2' | 's3' | 's4' }[] = [
  { icon: UserPlus, key: 's1' },
  { icon: Search, key: 's2' },
  { icon: CreditCard, key: 's3' },
  { icon: MapPinned, key: 's4' },
]

export async function HowItWorks() {
  const { t } = await getT()

  return (
    <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 md:px-6 md:py-28">
      <SectionHeading align="center" eyebrow={t('how.eyebrow')} title={t('how.title')} />
      <ol className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.key} className="relative flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <s.icon className="size-5" aria-hidden="true" />
              </span>
              <span className="font-heading text-sm font-bold text-muted-foreground">0{i + 1}</span>
            </div>
            <h3 className="text-lg font-semibold">{t(`how.${s.key}.title` as MessageKey)}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t(`how.${s.key}.body` as MessageKey)}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
