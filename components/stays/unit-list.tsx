'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UnitForm } from '@/components/stays/unit-form'
import { formatMoney } from '@/lib/account'
import type { StayKind, StayUnit } from '@/lib/stays'

export function UnitList({ propertyId, kind, currency, locale, units }: { propertyId: string; kind: StayKind; currency: string; locale: string; units: StayUnit[] }) {
  const [editing, setEditing] = useState<string | null>(null)
  return (
    <div className="flex flex-col gap-4">
      {units.length > 0 && (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {units.map((u) => (
            <li key={u.id} className="p-4">
              {editing === u.id ? (
                <UnitForm propertyId={propertyId} kind={kind} currency={currency} unit={u} onDone={() => setEditing(null)} />
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {u.name}
                      {!u.is_active && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">Closed</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Sleeps {u.max_guests} · {formatMoney(Number(u.nightly_rate), currency, locale)}/night
                      {kind === 'hotel' ? ` · ${u.quantity} room${u.quantity === 1 ? '' : 's'}` : ''}
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditing(u.id)}>Edit</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="rounded-2xl border border-dashed p-4">
        <p className="mb-3 font-medium">{kind === 'hotel' ? 'Add a room type' : 'Add a unit'}</p>
        <UnitForm propertyId={propertyId} kind={kind} currency={currency} />
      </div>
    </div>
  )
}
