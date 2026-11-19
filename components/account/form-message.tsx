import type { ActionState } from '@/lib/account'
import { cn } from '@/lib/utils'

export function FormMessage({ state }: { state: ActionState }) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        'rounded-lg px-3 py-2 text-sm empty:hidden',
        state?.ok ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive',
      )}
    >
      {state?.message}
    </p>
  )
}
