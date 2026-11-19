'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { fieldClass } from '@/lib/account'
import { errorMessage } from '@/lib/rides'

type Category = { code: string; name: string; seats: number }
type Existing = {
  license_number: string
  vehicle_make: string
  vehicle_model: string
  vehicle_year: number
  vehicle_color: string
  plate_number: string
  category_code: string
} | null

export function DriverApplication({ categories, existing }: { categories: Category[]; existing: Existing }) {
  const router = useRouter()
  const base = useId()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const year = new Date().getFullYear()

  async function submit(form: FormData) {
    setPending(true)
    setError('')
    const { error } = await createClient().rpc('submit_driver_application', {
      p_license: String(form.get('license') ?? ''),
      p_make: String(form.get('make') ?? ''),
      p_model: String(form.get('model') ?? ''),
      p_year: Number(form.get('year')),
      p_color: String(form.get('color') ?? ''),
      p_plate: String(form.get('plate') ?? ''),
      p_category: String(form.get('category') ?? ''),
    })
    setPending(false)
    if (error) return setError(errorMessage(error, 'Could not submit. Check your details and try again.'))
    router.refresh()
  }

  const fields = [
    { name: 'license', label: "Driver's licence number", def: existing?.license_number, min: 4, max: 40 },
    { name: 'make', label: 'Vehicle make', def: existing?.vehicle_make, placeholder: 'Toyota', min: 2, max: 40 },
    { name: 'model', label: 'Vehicle model', def: existing?.vehicle_model, placeholder: 'Corolla', min: 1, max: 40 },
    { name: 'color', label: 'Colour', def: existing?.vehicle_color, placeholder: 'Silver', min: 2, max: 30 },
    { name: 'plate', label: 'Plate number', def: existing?.plate_number, placeholder: 'GR 1234-24', min: 3, max: 20 },
  ]

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit(new FormData(e.currentTarget))
      }}
      className="flex flex-col gap-4 rounded-2xl border bg-card p-5 md:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.name} className="flex flex-col gap-1.5">
            <label htmlFor={`${base}-${f.name}`} className="text-xs font-semibold text-muted-foreground">
              {f.label}
            </label>
            <input
              id={`${base}-${f.name}`}
              name={f.name}
              defaultValue={f.def}
              placeholder={f.placeholder}
              minLength={f.min}
              maxLength={f.max}
              required
              className={fieldClass}
            />
          </div>
        ))}
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${base}-year`} className="text-xs font-semibold text-muted-foreground">
            Year
          </label>
          <input
            id={`${base}-year`}
            name="year"
            type="number"
            min={1995}
            max={year + 1}
            defaultValue={existing?.vehicle_year ?? year - 5}
            required
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor={`${base}-category`} className="text-xs font-semibold text-muted-foreground">
            Service category
          </label>
          <select id={`${base}-category`} name="category" defaultValue={existing?.category_code ?? 'economy'} className={fieldClass}>
            {categories.map((c) => (
              <option key={c.code} value={c.code}>{`${c.name} (${c.seats} seats)`}</option>
            ))}
          </select>
        </div>
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="h-11" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : existing ? 'Resubmit application' : 'Submit application'}
      </Button>
      <p className="text-xs text-muted-foreground">
        Our safety team verifies your licence and vehicle before you can accept trips. You will be able to upload documents once
        document verification launches.
      </p>
    </form>
  )
}
