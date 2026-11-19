import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { CountryProvider } from '@/components/country-provider'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })

export const metadata: Metadata = {
  title: {
    default: 'CHALEGO — Everything You Need, All in One Place',
    template: '%s | CHALEGO',
  },
  description:
    "CHALEGO is Africa's all-in-one platform for rides, vehicle, truck and equipment rentals, cargo, moto delivery, hotels, apartments, airport transfers and food delivery across Ghana and Nigeria.",
  keywords: ['ride hailing Ghana', 'car rental Lagos', 'food delivery Accra', 'airport transfer Kotoka', 'equipment rental Nigeria', 'CHALEGO'],
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#14513a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="antialiased">
        <CountryProvider>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </CountryProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
