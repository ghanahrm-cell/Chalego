'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { CreditCard, Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { startStripeCheckout } from '@/app/account/pay/actions'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

export function StripeCheckout({ kind, bookingId, amountLabel, detailPath }: { kind: string; bookingId: string; amountLabel: string; detailPath: string }) {
  const router = useRouter()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (!stripePromise) {
    return <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Card payments are not available right now.</p>
  }

  function begin() {
    setError(null)
    startTransition(async () => {
      const result = await startStripeCheckout(kind, bookingId)
      if ('clientSecret' in result) setClientSecret(result.clientSecret)
      else if ('paid' in result) router.push(`${detailPath}?paid=1`)
      else setError(result.error)
    })
  }

  if (clientSecret) {
    return (
      <div className="overflow-hidden rounded-xl border bg-card" aria-label="Secure card payment">
        <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <Button size="lg" onClick={begin} disabled={pending} className="w-full sm:w-auto">
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CreditCard aria-hidden="true" />}
        {pending ? 'Preparing secure checkout…' : `Pay ${amountLabel} by card`}
      </Button>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="size-3.5" aria-hidden="true" />
        Card details are entered on Stripe and never reach CHALEGO servers.
      </p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
