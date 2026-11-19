'use client'

import { useActionState } from 'react'
import { setUserRole } from '@/app/admin/user-actions'
import type { Role } from '@/lib/account'

const ROLES: { value: Role; label: string }[] = [
  { value: 'customer', label: 'Customer' },
  { value: 'driver', label: 'Driver' },
  { value: 'rider', label: 'Rider' },
  { value: 'partner', label: 'Partner' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super admin' },
]

export function RoleForm({ userId, role, name }: { userId: string; role: Role; name: string }) {
  const [state, action, pending] = useActionState(setUserRole, null)
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={userId} />
      <label htmlFor={`role-${userId}`} className="sr-only">Role for {name}</label>
      <select
        id={`role-${userId}`}
        name="role"
        defaultValue={role}
        className="h-9 rounded-lg border bg-background px-2 text-sm"
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save'}
      </button>
      {state && (
        <span role="status" className={state.ok ? 'text-xs text-primary' : 'text-xs text-destructive'}>
          {state.message}
        </span>
      )}
    </form>
  )
}
