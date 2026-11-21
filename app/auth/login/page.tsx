import type { Metadata } from 'next'
import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/auth/login-form'
import { safeNextPath } from '@/lib/account'

export const metadata: Metadata = { title: 'Log in | CHALEGO' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return (
    <AuthShell title="Welcome back" description="Log in to manage your bookings, payments and saved places.">
      <LoginForm next={safeNextPath(next)} />
    </AuthShell>
  )
}
