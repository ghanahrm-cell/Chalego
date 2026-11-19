import { Plus } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'

const FAQS = [
  { q: 'Which countries does CHALEGO operate in?', a: 'We launch in Ghana (prices in GHS) and Nigeria (prices in NGN), with Kenya, Uganda, Tanzania, Rwanda, South Africa, Zambia, Côte d’Ivoire and Senegal planned next.' },
  { q: 'Do I need a separate account for each service?', a: 'No. One CHALEGO account gives you access to rides, rentals, cargo, deliveries, equipment, hotels, apartments, airport transfers and food.' },
  { q: 'How can I pay?', a: 'CHALEGO supports mobile money, debit and credit cards, bank transfer and the CHALEGO wallet. Local payment providers are integrated for each country.' },
  { q: 'How are drivers and partners verified?', a: 'Every driver, rider, host and business partner completes identity and document verification, and vehicles are checked before they can accept bookings.' },
  { q: 'What happens if I need to cancel?', a: 'Each service shows its cancellation policy before you pay. Eligible refunds are returned to your original payment method or CHALEGO wallet.' },
  { q: 'When will all services be live?', a: 'We are rolling out in phases. Rides and airport transfers come first, followed by rentals, cargo and deliveries, equipment, stays and food delivery.' },
]

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 md:px-6 md:py-28">
      <SectionHeading align="center" eyebrow="FAQ" title="Questions, answered" />
      <div className="mt-12 divide-y rounded-2xl border bg-card">
        {FAQS.map((f) => (
          <details key={f.q} className="group px-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium">
              {f.q}
              <Plus className="size-5 shrink-0 text-primary transition-transform group-open:rotate-45" aria-hidden="true" />
            </summary>
            <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
