'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { fieldClass } from '@/lib/account'
import { cn } from '@/lib/utils'

type Message = { id: string; sender_id: string; body: string; created_at: string }

async function loadMessages([, rideId]: [string, string]) {
  const { data, error } = await createClient()
    .from('ride_messages')
    .select('id, sender_id, body, created_at')
    .eq('ride_id', rideId)
    .order('created_at')
    .limit(200)
  if (error) throw error
  return data as Message[]
}

export function TripChat({ rideId, userId, canSend, otherName }: { rideId: string; userId: string; canSend: boolean; otherName: string }) {
  const { data: messages, mutate } = useSWR(['ride-messages', rideId], loadMessages, {
    refreshInterval: canSend ? 4000 : 0,
  })
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages?.length])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const text = body.trim()
    if (!text) return
    setSending(true)
    setError('')
    const { error } = await createClient().from('ride_messages').insert({ ride_id: rideId, body: text.slice(0, 500) })
    setSending(false)
    if (error) return setError('Message not sent. Chat is only open during an active trip.')
    setBody('')
    mutate()
  }

  return (
    <section aria-labelledby="chat-heading" className="flex flex-col rounded-2xl border bg-card">
      <h2 id="chat-heading" className="border-b px-4 py-3 font-heading font-semibold">
        Messages with {otherName}
      </h2>
      <ol ref={listRef} aria-live="polite" className="flex max-h-72 min-h-32 flex-col gap-2 overflow-y-auto p-4">
        {(messages ?? []).length === 0 && <li className="m-auto text-sm text-muted-foreground">No messages yet.</li>}
        {(messages ?? []).map((m) => {
          const mine = m.sender_id === userId
          return (
            <li
              key={m.id}
              className={cn(
                'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                mine ? 'self-end rounded-br-sm bg-primary text-primary-foreground' : 'self-start rounded-bl-sm bg-muted',
              )}
            >
              <span className="sr-only">{mine ? 'You' : otherName}: </span>
              {m.body}
              <time className={cn('mt-0.5 block text-[10px]', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </time>
            </li>
          )
        })}
      </ol>
      {canSend ? (
        <form onSubmit={send} className="flex gap-2 border-t p-3">
          <label htmlFor="chat-input" className="sr-only">
            Message
          </label>
          <input
            id="chat-input"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={500}
            placeholder="Type a message"
            className={fieldClass}
          />
          <Button type="submit" size="icon" className="size-11 shrink-0" disabled={sending || !body.trim()}>
            {sending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      ) : (
        <p className="border-t px-4 py-3 text-xs text-muted-foreground">Chat opens once a driver accepts and closes when the trip ends.</p>
      )}
      {error && <p className="px-4 pb-3 text-xs text-destructive">{error}</p>}
    </section>
  )
}
