'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { refundStripePayment, type RefundState } from '@/app/admin/stripe/actions'

export function StripeRefundForm({ id, remaining, currency }: { id: string; remaining: number; currency: string }) {
  const [state, action, pending] = useActionState<RefundState, FormData>(refundStripePayment, {})

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={id} />
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground">Amount ({currency})</span>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          max={remaining}
          placeholder={remaining.toFixed(2)}
          className="h-8 w-28 rounded-md border bg-background px-2 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground">Reason</span>
        <select name="reason" className="h-8 rounded-md border bg-background px-2 text-sm" defaultValue="requested_by_customer">
          <option value="requested_by_customer">Customer request</option>
          <option value="duplicate">Duplicate</option>
          <option value="fraudulent">Fraudulent</option>
        </select>
      </label>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
        Refund
      </Button>
      {state.error && <p role="alert" className="w-full text-xs text-destructive">{state.error}</p>}
      {state.ok && <p role="status" className="w-full text-xs text-primary">{state.ok}</p>}
    </form>
  )
}
