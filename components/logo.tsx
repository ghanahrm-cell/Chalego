import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2', className)} aria-label="CHALEGO home">
      <span
        aria-hidden="true"
        className={cn(
          'flex size-9 items-center justify-center rounded-lg font-heading text-lg font-bold',
          inverted ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground',
        )}
      >
        C
      </span>
      <span
        className={cn(
          'font-heading text-xl font-bold tracking-tight',
          inverted ? 'text-ink-foreground' : 'text-foreground',
        )}
      >
        CHALE<span className="text-accent">GO</span>
      </span>
    </Link>
  )
}
