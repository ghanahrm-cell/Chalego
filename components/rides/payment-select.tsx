'use client'

import { useId } from 'react'
import { fieldClass, type PaymentMethod } from '@/lib/account'

export function PaymentSelect({
  methods,
  value,
  onChange,
}: {
  methods: PaymentMethod[]
  value: string
  onChange: (v: string) => void
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-muted-foreground">
        Payment
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass} required>
        {methods.map((m) => (
          <option key={m.id} value={m.provider}>
            {m.display_name}
          </option>
        ))}
      </select>
    </div>
  )
}
