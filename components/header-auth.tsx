'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function HeaderAuth({ onNavigate }: { onNavigate?: () => void }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const { data } = createClient().auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session))
    })
    return () => data.subscription.unsubscribe()
  }, [])

  if (signedIn === null) return <div className="h-8 w-36" aria-hidden="true" />

  if (signedIn) {
    return (
      <Button size="sm" render={<Link href="/account" onClick={onNavigate} />} nativeButton={false}>
        <UserRound className="size-4" aria-hidden="true" />
        My account
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" render={<Link href="/auth/login" onClick={onNavigate} />} nativeButton={false}>
        Log in
      </Button>
      <Button size="sm" render={<Link href="/auth/sign-up" onClick={onNavigate} />} nativeButton={false}>
        Sign up
      </Button>
    </div>
  )
}
