import Image from 'next/image'
import type { ReactNode } from 'react'

export function AuthShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main id="main" className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-12 md:px-8">
        <div className="w-full max-w-md">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-balance md:text-4xl">{title}</h1>
          <p className="mt-2 text-muted-foreground text-pretty">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <Image src="/images/hero.jpg" alt="" fill sizes="50vw" className="object-cover opacity-40" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-primary-foreground">
          <p className="font-heading text-3xl font-bold leading-tight text-balance">
            One account. Ten services. Ghana, Nigeria and Côte d&apos;Ivoire.
          </p>
          <p className="mt-3 max-w-md text-primary-foreground/80">
            Rides, rentals, cargo, stays, airport transfers and food, all paid from one secure CHALEGO account.
          </p>
        </div>
      </div>
    </main>
  )
}
