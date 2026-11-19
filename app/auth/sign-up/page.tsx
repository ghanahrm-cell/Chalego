import type { Metadata } from 'next'
import { AuthShell } from '@/components/auth/auth-shell'
import { SignUpForm } from '@/components/auth/sign-up-form'

export const metadata: Metadata = { title: 'Create your account | CHALEGO' }

export default function SignUpPage() {
  return (
    <AuthShell title="Create your CHALEGO account" description="One account for rides, rentals, deliveries, stays and food across Ghana and Nigeria.">
      <SignUpForm />
    </AuthShell>
  )
}
