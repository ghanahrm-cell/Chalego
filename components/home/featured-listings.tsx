'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Star } from 'lucide-react'
import { useCountry } from '@/components/country-provider'
import { SectionHeading } from '@/components/section-heading'
import type { CountryCode } from '@/lib/countries'

type Listing = {
  title: string
  type: string
  href: string
  image: string
  unit: string
  rating: number
  location: Record<CountryCode, string>
  price: Record<CountryCode, number>
}

const LISTINGS: Listing[] = [
  {
    title: 'Toyota Land Cruiser Prado',
    type: 'Vehicle rental',
    href: '/services/vehicle-rentals',
    image: '/images/car-suv.png',
    unit: '/ day',
    rating: 4.9,
    location: { GH: 'East Legon, Accra', NG: 'Victoria Island, Lagos' },
    price: { GH: 1450, NG: 165000 },
  },
  {
    title: 'The Palms Boutique Hotel',
    type: 'Hotel',
    href: '/services/hotels',
    image: '/images/hotel.png',
    unit: '/ night',
    rating: 4.8,
    location: { GH: 'Airport Residential, Accra', NG: 'Ikoyi, Lagos' },
    price: { GH: 2100, NG: 240000 },
  },
  {
    title: 'Skyline 2-Bed Serviced Apartment',
    type: 'Apartment',
    href: '/services/apartments',
    image: '/images/apartment.png',
    unit: '/ night',
    rating: 4.7,
    location: { GH: 'Cantonments, Accra', NG: 'Lekki Phase 1, Lagos' },
    price: { GH: 980, NG: 110000 },
  },
  {
    title: 'CAT 320 Excavator',
    type: 'Equipment',
    href: '/services/equipment-rentals',
    image: '/images/excavator.png',
    unit: '/ day',
    rating: 4.9,
    location: { GH: 'Tema, Greater Accra', NG: 'Ikeja, Lagos' },
    price: { GH: 6500, NG: 750000 },
  },
]

export function FeaturedListings() {
  const { formatPrice, country } = useCountry()

  return (
    <section className="bg-secondary/60">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <SectionHeading
          eyebrow={`Featured in ${country.name}`}
          title="Popular this week"
          description="A preview of the verified vehicles, stays and machines coming to CHALEGO. Switch country in the header to see local pricing."
        />
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {LISTINGS.map((l) => (
            <li key={l.title}>
              <Link href={l.href} className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-lg">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={l.image}
                    alt={l.title}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-card/95 px-2.5 py-1 text-xs font-semibold text-foreground">
                    {l.type}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-snug">{l.title}</h3>
                    <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
                      <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />
                      {l.rating}
                      <span className="sr-only"> out of 5</span>
                    </span>
                  </div>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" aria-hidden="true" /> {l.location[country.code]}
                  </p>
                  <p className="mt-auto pt-2">
                    <span className="text-lg font-bold">{formatPrice(l.price)}</span>{' '}
                    <span className="text-sm text-muted-foreground">{l.unit}</span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
