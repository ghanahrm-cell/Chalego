'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export type NotificationRow = {
  id: string
  kind: string
  title: string
  body: string
  link: string | null
  read_at: string | null
  created_at: string
}

async function fetchRecent(): Promise<NotificationRow[]> {
  const { data, error } = await createClient()
    .from('notifications')
    .select('id, kind, title, body, link, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(8)
  if (error) throw error
  return data ?? []
}

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

export function NotificationBell({ onNavigate }: { onNavigate?: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data, mutate } = useSWR('notifications:recent', fetchRecent, { refreshInterval: 30000 })
  const unread = data?.filter((n) => !n.read_at).length ?? 0

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  async function markAllRead() {
    await createClient().rpc('mark_notifications_read', { p_ids: null })
    mutate()
  }

  async function openItem(n: NotificationRow) {
    setOpen(false)
    onNavigate?.()
    if (!n.read_at) {
      await createClient().rpc('mark_notifications_read', { p_ids: [n.id] })
      mutate()
    }
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className="relative"
      >
        <Bell className="size-4" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="font-heading text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="text-xs font-medium text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {!data?.length && <li className="px-4 py-8 text-center text-sm text-muted-foreground">{"You're all caught up."}</li>}
            {data?.map((n) => (
              <li key={n.id} className="border-b last:border-0">
                <Link
                  href={n.link ?? '/account/notifications'}
                  onClick={() => openItem(n)}
                  className={cn('flex gap-3 px-4 py-3 text-sm hover:bg-muted', !n.read_at && 'bg-primary/5')}
                >
                  <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.read_at ? 'bg-transparent' : 'bg-primary')} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{n.title}</span>
                    <span className="line-clamp-2 block text-muted-foreground">{n.body}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/account/notifications"
            onClick={() => { setOpen(false); onNavigate?.() }}
            className="block border-t px-4 py-2.5 text-center text-sm font-medium text-primary hover:bg-muted"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  )
}
