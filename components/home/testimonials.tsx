import { Quote } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'

const TESTIMONIALS = [
  { quote: 'I landed at Kotoka at 2am and my driver was waiting with my name on a board. Then I ordered waakye to my apartment — same app.', name: 'Ama Owusu', role: 'Consultant, Accra' },
  { quote: 'We rent excavators and tipper trucks for our sites in Lagos through one dashboard. Delivery to site is a game changer.', name: 'Chinedu Okafor', role: 'Project Manager, Lagos' },
  { quote: 'Listing our boutique hotel brought weekend bookings from Nigeria we never reached before. Payouts are always on time.', name: 'Kofi Asante', role: 'Hotel Owner, Kumasi' },
]

export function Testimonials() {
  return (
    <section className="bg-secondary/60">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <SectionHeading align="center" eyebrow="Loved across West Africa" title="What early users are saying" />
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <li key={t.name}>
              <figure className="flex h-full flex-col gap-4 rounded-2xl border bg-card p-6">
                <Quote className="size-6 text-accent" aria-hidden="true" />
                <blockquote className="flex-1 leading-relaxed text-foreground/90">{`"${t.quote}"`}</blockquote>
                <figcaption className="flex items-center gap-3 border-t pt-4">
                  <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                    {t.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{t.name}</span>
                    <span className="block text-xs text-muted-foreground">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
