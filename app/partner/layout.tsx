import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Partner', robots: { index: false } }

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return <main id="main" className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 lg:py-10">{children}</main>
}
