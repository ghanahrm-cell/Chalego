import Link from 'next/link'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fieldClass } from '@/lib/account'
import { requireAdmin } from '@/lib/session'
import { cn } from '@/lib/utils'
import { reviewDriver } from '../ride-actions'

const FILTERS = ['pending', 'approved', 'suspended', 'rejected'] as const
type Filter = (typeof FILTERS)[number]

const BADGE: Record<Filter, string> = {
  pending: 'bg-accent/25 text-accent-foreground',
  approved: 'bg-primary/10 text-primary',
  suspended: 'bg-destructive/10 text-destructive',
  rejected: 'bg-muted text-muted-foreground',
}

export default async function AdminDriversPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { supabase } = await requireAdmin()
  const sp = await searchParams
  const status: Filter = FILTERS.includes(sp.status as Filter) ? (sp.status as Filter) : 'pending'

  const { data: drivers } = await supabase
    .from('drivers')
    .select('id, country_code, license_number, vehicle_make, vehicle_model, vehicle_year, vehicle_color, plate_number, category_code, status, review_note, is_online, rating_avg, rating_count, created_at')
    .eq('status', status)
    .order('created_at', { ascending: status !== 'pending' })
    .limit(100)

  const ids = (drivers ?? []).map((d) => d.id)
  const { data: profiles } = ids.length
    ? await supabase.from('profiles').select('id, full_name, email, phone').in('id', ids)
    : { data: [] as { id: string; full_name: string | null; email: string | null; phone: string | null }[] }
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Drivers</h1>
        <p className="mt-1 text-muted-foreground">Verify new applicants and manage active drivers.</p>
      </header>

      <nav aria-label="Driver status" className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/admin/drivers?status=${f}`}
            aria-current={f === status ? 'page' : undefined}
            className={cn(
              'shrink-0 rounded-lg px-4 py-2 text-sm font-medium capitalize',
              f === status ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {f}
          </Link>
        ))}
      </nav>

      {(drivers ?? []).length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card p-10 text-center text-muted-foreground">No {status} drivers.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {drivers!.map((d) => {
            const p = profileById.get(d.id)
            return (
              <li key={d.id} className="rounded-xl border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-heading text-lg font-semibold">{p?.full_name ?? 'Unnamed driver'}</p>
                    <p className="text-sm text-muted-foreground">
                      {p?.email} {p?.phone && `· ${p.phone}`} · {d.country_code}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {d.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="size-4 fill-accent text-accent" aria-hidden="true" />
                        {Number(d.rating_avg).toFixed(1)} ({d.rating_count})
                      </span>
                    )}
                    {d.is_online && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">Online</span>}
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', BADGE[d.status as Filter])}>{d.status}</span>
                  </div>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-xs text-muted-foreground">Vehicle</dt>
                    <dd>{`${d.vehicle_year} ${d.vehicle_color} ${d.vehicle_make} ${d.vehicle_model}`}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Plate</dt>
                    <dd className="font-mono">{d.plate_number}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Licence</dt>
                    <dd className="font-mono">{d.license_number}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Category</dt>
                    <dd className="capitalize">{d.category_code}</dd>
                  </div>
                </dl>
                {d.review_note && <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm">Note: {d.review_note}</p>}
                <form action={reviewDriver} className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row">
                  <input type="hidden" name="id" value={d.id} />
                  <label htmlFor={`note-${d.id}`} className="sr-only">
                    Review note
                  </label>
                  <input id={`note-${d.id}`} name="note" maxLength={300} placeholder="Note to driver (optional)" className={cn(fieldClass, 'h-9 flex-1')} />
                  <div className="flex gap-2">
                    {d.status !== 'approved' && (
                      <Button type="submit" name="status" value="approved" size="sm" className="h-9">
                        Approve
                      </Button>
                    )}
                    {d.status === 'pending' && (
                      <Button type="submit" name="status" value="rejected" size="sm" variant="outline" className="h-9">
                        Reject
                      </Button>
                    )}
                    {d.status === 'approved' && (
                      <Button type="submit" name="status" value="suspended" size="sm" variant="destructive" className="h-9">
                        Suspend
                      </Button>
                    )}
                  </div>
                </form>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
