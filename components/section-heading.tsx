import { cn } from '@/lib/utils'

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  inverted = false,
}: {
  eyebrow: string
  title: string
  description?: string
  align?: 'left' | 'center'
  inverted?: boolean
}) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      <p className={cn('text-sm font-semibold uppercase tracking-wider', inverted ? 'text-accent' : 'text-primary')}>
        {eyebrow}
      </p>
      <h2 className={cn('mt-3 text-3xl font-bold md:text-5xl', inverted ? 'text-ink-foreground' : 'text-foreground')}>
        {title}
      </h2>
      {description && (
        <p className={cn('mt-4 text-pretty leading-relaxed md:text-lg', inverted ? 'text-ink-foreground/75' : 'text-muted-foreground')}>
          {description}
        </p>
      )}
    </div>
  )
}
