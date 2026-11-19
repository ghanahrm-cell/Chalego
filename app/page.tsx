import { Hero } from '@/components/home/hero'
import { ServicesGrid } from '@/components/home/services-grid'
import { FeaturedListings } from '@/components/home/featured-listings'
import { AirportSection } from '@/components/home/airport-section'
import { HowItWorks } from '@/components/home/how-it-works'
import { EarnSection } from '@/components/home/earn-section'
import { Testimonials } from '@/components/home/testimonials'
import { AppPromo } from '@/components/home/app-promo'
import { Faq } from '@/components/home/faq'

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesGrid />
      <FeaturedListings />
      <HowItWorks />
      <AirportSection />
      <EarnSection />
      <Testimonials />
      <AppPromo />
      <Faq />
    </>
  )
}
