import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Check your email | CHALEGO' }

export default function SignUpSuccessPage() {
  return (
    <main id="main" className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <MailCheck className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-heading text-2xl font-bold">Check your email</h1>
        <p className="mt-2 text-muted-foreground text-pretty">
          We sent a confirmation link to your inbox. Open it to activate your account, then log in.
        </p>
        <Button className="mt-6" render={<Link href="/auth/login" />} nativeButton={false}>
          Go to log in
        </Button>
      </div>
    </main>
  )
}
