'use client'

import { useId, useState } from 'react'
import { ArrowRight, Info, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCountry } from '@/components/country-provider'
import { getDivision, type BookingField } from '@/lib/divisions'
import { cn } from '@/lib/utils'

const fieldClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30'

export function BookingForm({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const division = getDivision(slug)
  const { country } = useCountry()
  const formId = useId()
  const [submitted, setSubmitted] = useState(false)

  if (!division) return null

  function renderField(field: BookingField) {
    const id = `${formId}-${field.name}`
    const common = { id, name: field.name, required: true, className: fieldClass }

    switch (field.type) {
      case 'select':
        return (
          <select {...common} defaultValue={field.options?.[0]}>
            {field.options?.map((o) => <option key={o}>{o}</option>)}
          </select>
        )
      case 'city':
        return (
          <select {...common} key={country.code} defaultValue={country.cities[0]}>
            {country.cities.map((c) => <option key={c}>{c}</option>)}
          </select>
        )
      case 'airport':
        return (
          <select {...common} key={country.code} defaultValue={country.airports[0].code}>
            {country.airports.map((a) => (
              <option key={a.code} value={a.code}>{`${a.name} (${a.code})`}</option>
            ))}
          </select>
        )
      case 'location':
        return (
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input {...common} type="text" autoComplete="street-address" placeholder={field.placeholder} className={cn(fieldClass, 'pl-9')} />
          </div>
        )
      case 'number':
        return <input {...common} type="number" min={1} inputMode="numeric" placeholder={field.placeholder} />
      default:
        return <input {...common} type={field.type} placeholder={field.placeholder} />
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(true)
      }}
      onChange={() => setSubmitted(false)}
      aria-describedby={submitted ? `${formId}-status` : undefined}
    >
      <div
        className={cn(
          'grid gap-3',
          compact ? 'sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]' : 'sm:grid-cols-2',
        )}
      >
        {division.fields.map((field) => (
          <div key={field.name} className="flex flex-col gap-1.5">
            <label htmlFor={`${formId}-${field.name}`} className="text-xs font-semibold text-muted-foreground">
              {field.label}
            </label>
            {renderField(field)}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Prices shown in <span className="font-semibold text-foreground">{country.currency}</span> for {country.name}.
        </p>
        <Button type="submit" className="h-11 px-5 text-sm">
          {division.ctaLabel} <ArrowRight data-icon="inline-end" aria-hidden="true" />
        </Button>
      </div>
      <div role="status" aria-live="polite" id={`${formId}-status`}>
        {submitted && (
          <p className="mt-4 flex items-start gap-2 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm text-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-accent-foreground" aria-hidden="true" />
            <span>
              Live {division.name.toLowerCase()} booking launches in rollout phase {division.phase}. Your search has not
              been submitted — create an account to be notified the moment it goes live in {country.name}.
            </span>
          </p>
        )}
      </div>
    </form>
  )
}
