import Image from 'next/image'
import { Smartphone } from 'lucide-react'

export function AppPromo() {
  return (
    <section id="app" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 md:px-6 md:py-28">
      <div className="grid items-center gap-10 overflow-hidden rounded-3xl bg-primary px-6 pt-10 text-primary-foreground md:px-12 lg:grid-cols-2 lg:pt-0">
        <div className="lg:py-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">The CHALEGO app</p>
          <h2 className="mt-3 text-3xl font-bold md:text-5xl">Ten services in your pocket.</h2>
          <p className="mt-4 max-w-md leading-relaxed text-primary-foreground/80">
            Native iOS and Android apps are on the way. Get notified the day they launch in your city.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {['App Store', 'Google Play'].map((store) => (
              <span
                key={store}
                className="flex items-center gap-3 rounded-xl border border-primary-foreground/25 bg-ink/30 px-4 py-2.5"
              >
                <Smartphone className="size-5" aria-hidden="true" />
                <span className="leading-tight">
                  <span className="block text-[0.65rem] uppercase tracking-wider text-primary-foreground/70">Coming soon to</span>
                  <span className="block text-sm font-semibold">{store}</span>
                </span>
              </span>
            ))}
          </div>
        </div>
        <div className="relative mx-auto aspect-[3/4] w-full max-w-sm self-end">
          <Image src="/images/app-phone.png" alt="CHALEGO app home screen on a smartphone" fill sizes="(min-width: 1024px) 24rem, 80vw" className="object-cover object-top" />
        </div>
      </div>
    </section>
  )
}
