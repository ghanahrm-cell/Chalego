import Link from 'next/link'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/session'
import { cn } from '@/lib/utils'
import { markAllNotificationsRead } from './actions'

export const metadata = { title: 'Notifications | CHALEGO', robots: { index: false } }

const KIND_LABEL: Record<string, string> = {
  ride: 'Ride',
  delivery: 'Delivery',
  booking: 'Booking',
  food: 'Food',
  payment: 'Payment',
  payout: 'Payout',
  partner: 'Partner',
  feedback: 'Feedback',
}

export default async function NotificationsPage() {
  await requireUser()
  const supabase = await createClient()
  const { data } = await supabase
    .from('notifications')
    .select('id, kind, title, body, link, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  const items = data ?? []
  const unread = items.filter((n) => !n.read_at).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Updates on your trips, bookings, orders, payouts, and partner account.
          </p>
        </div>
        {unread > 0 && (
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="outline" size="sm">Mark all as read</Button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <Bell className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">No notifications yet</p>
          <p className="text-sm text-muted-foreground">{"We'll let you know when something happens."}</p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {items.map((n) => (
            <li key={n.id}>
              <Link
                href={n.link ?? '/account'}
                className={cn('flex gap-4 p-4 transition-colors hover:bg-muted', !n.read_at && 'bg-primary/5')}
              >
                <span className={cn('mt-2 size-2 shrink-0 rounded-full', n.read_at ? 'bg-border' : 'bg-primary')} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{n.title}</p>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {KIND_LABEL[n.kind] ?? n.kind}
                    </span>
                    {!n.read_at && <span className="sr-only">Unread</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                </div>
                <time dateTime={n.created_at} className="shrink-0 text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
