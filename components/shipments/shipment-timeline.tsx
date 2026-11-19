import { Check, Circle, XCircle } from 'lucide-react'
import { SHIPMENT_STATUS_LABEL, SHIPMENT_STEPS, type ShipmentStatus } from '@/lib/shipments'
import { cn } from '@/lib/utils'

type Event = { status: ShipmentStatus; note: string | null; at: string }

export function ShipmentTimeline({ status, events, locale }: { status: ShipmentStatus; events: Event[]; locale: string }) {
  if (status === 'cancelled') {
    const last = events.at(-1)
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <XCircle className="size-5 text-destructive" aria-hidden="true" />
        {last?.note ?? 'Cancelled'}
        {last && <span>· {new Date(last.at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}</span>}
      </p>
    )
  }

  const current = SHIPMENT_STEPS.indexOf(status)
  return (
    <ol className="flex flex-col">
      {SHIPMENT_STEPS.map((step, i) => {
        const done = i <= current
        const event = [...events].reverse().find((e) => e.status === step)
        return (
          <li key={step} className="flex gap-3" aria-current={i === current ? 'step' : undefined}>
            <span className="flex flex-col items-center">
              <span
                className={cn(
                  'flex size-6 items-center justify-center rounded-full',
                  done ? 'bg-primary text-primary-foreground' : 'border bg-card text-muted-foreground',
                )}
              >
                {done ? <Check className="size-3.5" aria-hidden="true" /> : <Circle className="size-2" aria-hidden="true" />}
              </span>
              {i < SHIPMENT_STEPS.length - 1 && <span className={cn('w-px flex-1', i < current ? 'bg-primary' : 'bg-border')} />}
            </span>
            <span className="pb-5">
              <span className={cn('block text-sm font-medium', !done && 'text-muted-foreground')}>{SHIPMENT_STATUS_LABEL[step]}</span>
              {event && done && (
                <span className="block text-xs text-muted-foreground">
                  {event.note} · {new Date(event.at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              )}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
