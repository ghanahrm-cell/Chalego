'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { errorMessage } from '@/lib/rides'
import { cn } from '@/lib/utils'

export function OpenToggle({ id, open }: { id: string; open: boolean }) {
  const router = useRouter()
  const [value, setValue] = useState(open)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function change(next: boolean) {
    setValue(next)
    setPending(true)
    setError('')
    const { error } = await createClient().rpc('set_restaurant_open', { p_id: id, p_open: next })
    setPending(false)
    if (error) {
      setValue(!next)
      return setError(errorMessage(error))
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <label className="flex items-center gap-3 rounded-full border bg-card px-4 py-2 text-sm font-medium">
        <span className={value ? 'text-primary' : 'text-muted-foreground'}>{value ? 'Accepting orders' : 'Closed'}</span>
        <button
          type="button"
          role="switch"
          aria-checked={value}
          aria-label="Accepting orders"
          disabled={pending}
          onClick={() => change(!value)}
          className={cn('relative h-6 w-11 rounded-full transition-colors disabled:opacity-60', value ? 'bg-primary' : 'bg-muted-foreground/30')}
        >
          <span className={cn('absolute top-0.5 left-0.5 size-5 rounded-full bg-background shadow transition-transform', value && 'translate-x-5')} />
        </button>
      </label>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
