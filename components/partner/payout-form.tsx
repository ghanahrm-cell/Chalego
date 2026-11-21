'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { fieldClass } from '@/lib/account'
import { requestPayout } from '@/app/partner/payout-actions'

type Balance = { currency: string; available: number; label: string }

export function PayoutForm({ balances }: { balances: Balance[] }) {
  const [state, action, pending] = useActionState(requestPayout, null)
  const payable = balances.filter((b) => b.available > 0)

  if (payable.length === 0) {
    return <p className="text-sm text-muted-foreground">You have no available balance to withdraw yet. Earnings become available once a booking or order is completed.</p>
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Currency
          <select name="currency" className={fieldClass} defaultValue={payable[0].currency}>
            {payable.map((b) => (
              <option key={b.currency} value={b.currency}>{`${b.currency} · ${b.label} available`}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Amount
          <input name="amount" type="number" inputMode="decimal" min="1" step="0.01" required className={fieldClass} placeholder="0.00" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Method
          <select name="method" className={fieldClass} defaultValue="mobile_money">
            <option value="mobile_money">Mobile money</option>
            <option value="bank_transfer">Bank transfer</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Pay into
          <input name="destination" required minLength={4} maxLength={200} className={fieldClass} placeholder="e.g. MTN 024 000 0000 or bank + account no." />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" className="h-11 px-5" disabled={pending}>
          {pending ? 'Requesting…' : 'Request payout'}
        </Button>
        {state && (
          <p role="status" className={state.ok ? 'text-sm text-primary' : 'text-sm text-destructive'}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  )
}
