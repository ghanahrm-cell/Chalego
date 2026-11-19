import Link from 'next/link'
import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Sign-in problem | CHALEGO' }

export default function AuthErrorPage() {
  return (
    <main id="main" className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <TriangleAlert className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-heading text-2xl font-bold">That link did not work</h1>
        <p className="mt-2 text-muted-foreground text-pretty">
          The confirmation link may have expired or already been used. Try logging in, or sign up again.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button render={<Link href="/auth/login" />} nativeButton={false}>Log in</Button>
          <Button variant="outline" render={<Link href="/auth/sign-up" />} nativeButton={false}>Sign up</Button>
        </div>
      </div>
    </main>
  )
}
