import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { requireUser } from '@/lib/session'
import { formatMoney } from '@/lib/account'
import { formatStayDates, STAY_STATUS_LABELS, STAY_STATUS_STYLES, type StayStatus } from '@/lib/stays'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'My stays', robots: { index: false } }

type Row = {
  id: string
  reference: string
  property_id: string
  status: StayStatus
  check_in: string
  check_out: string
  total_amount: number
  currency: string
}

export default async function MyStaysPage() {
  const { supabase, user, country } = await requireUser('/account/stays')
  const locale = country?.locale ?? 'en-GH'
  const { data: rows } = await supabase
    .from('stay_bookings')
    .select('id, reference, property_id, status, check_in, check_out, total_amount, currency')
    .eq('guest_id', user.id)
    .order('check_in', { ascending: false })
    .limit(50)
    .returns<Row[]>()
  const ids = [...new Set((rows ?? []).map((r) => r.property_id))]
  const { data: props } = ids.length
    ? await supabase.from('stay_properties').select('id, title, city').in('id', ids).returns<{ id: string; title: string; city: string }[]>()
    : { data: [] }
  const byId = new Map((props ?? []).map((p) => [p.id, p]))

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">My stays</h1>
          <p className="text-sm text-muted-foreground">Hotel and apartment bookings.</p>
        </div>
        <Link href="/stays" className="text-sm font-medium text-primary hover:underline">Find a stay</Link>
      </header>
      {(rows ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No stays yet. <Link href="/stays" className="font-medium text-primary hover:underline">Browse hotels and apartments</Link>
        </p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {rows!.map((r) => (
            <li key={r.id}>
              <Link href={`/account/stays/${r.id}`} className="flex items-center gap-4 px-4 py-4 hover:bg-muted/50">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{byId.get(r.property_id)?.title ?? 'Stay'}</p>
                  <p className="text-sm text-muted-foreground">{r.reference} · {formatStayDates(r.check_in, r.check_out, locale)}</p>
                </div>
                <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', STAY_STATUS_STYLES[r.status])}>{STAY_STATUS_LABELS[r.status]}</span>
                <span className="hidden font-medium sm:block">{formatMoney(Number(r.total_amount), r.currency, locale)}</span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
