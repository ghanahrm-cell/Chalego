import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/session'
import { fieldClass, type Profile, type Role } from '@/lib/account'
import { RoleForm } from '@/components/admin/role-form'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Users · Admin' }

const PAGE_SIZE = 25
const ROLE_FILTERS: (Role | 'all')[] = ['all', 'customer', 'driver', 'rider', 'partner', 'corporate', 'admin', 'super_admin']

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>
}) {
  const { supabase, profile, user } = await requireAdmin()
  const sp = await searchParams
  const q = (sp.q ?? '').replace(/[^\p{L}\p{N}\s+@.-]/gu, '').trim().slice(0, 60)
  const role = ROLE_FILTERS.includes(sp.role as Role) ? (sp.role as Role | 'all') : 'all'
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1)
  const isSuper = profile?.role === 'super_admin'

  let query = supabase
    .from('profiles')
    .select('id, full_name, phone, country_code, role, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  if (role !== 'all') query = query.eq('role', role)
  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)

  const { data, count, error } = await query
  const users = (data ?? []) as Pick<Profile, 'id' | 'full_name' | 'phone' | 'country_code' | 'role' | 'created_at'>[]
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))

  const href = (p: Record<string, string | number>) => {
    const params = new URLSearchParams({ ...(q && { q }), ...(role !== 'all' && { role }), ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v)])) })
    return `/admin/users?${params}`
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Users</h1>
        <p className="mt-1 text-muted-foreground">
          {(count ?? 0).toLocaleString()} accounts. {isSuper ? 'You can change roles.' : 'Only super admins can change roles.'}
        </p>
      </header>

      <form className="flex flex-col gap-3 sm:flex-row" role="search">
        <label htmlFor="q" className="sr-only">Search by name or phone</label>
        <input id="q" name="q" defaultValue={q} placeholder="Search by name or phone" className={cn(fieldClass, 'sm:max-w-xs')} />
        <label htmlFor="role" className="sr-only">Filter by role</label>
        <select id="role" name="role" defaultValue={role} className={cn(fieldClass, 'sm:max-w-[12rem]')}>
          {ROLE_FILTERS.map((r) => (
            <option key={r} value={r}>{r === 'all' ? 'All roles' : r.replace('_', ' ')}</option>
          ))}
        </select>
        <button type="submit" className="h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Filter
        </button>
      </form>

      {error && <p role="alert" className="text-sm text-destructive">{error.message}</p>}

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="border-b bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Name</th>
              <th scope="col" className="px-4 py-3 font-medium">Phone</th>
              <th scope="col" className="px-4 py-3 font-medium">Country</th>
              <th scope="col" className="px-4 py-3 font-medium">Joined</th>
              <th scope="col" className="px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No users match.</td>
              </tr>
            )}
            {users.map((u) => {
              const name = u.full_name || 'Unnamed user'
              return (
                <tr key={u.id}>
                  <th scope="row" className="px-4 py-3 text-left font-medium">
                    {name}
                    {u.id === user.id && <span className="ml-2 text-xs font-normal text-muted-foreground">(you)</span>}
                  </th>
                  <td className="px-4 py-3 tabular-nums">{u.phone ?? '—'}</td>
                  <td className="px-4 py-3">{u.country_code}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3">
                    {isSuper && u.id !== user.id ? (
                      <RoleForm userId={u.id} role={u.role} name={name} />
                    ) : (
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize">{u.role.replace('_', ' ')}</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {pages}</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={href({ page: page - 1 })} className="rounded-lg border px-3 py-1.5 hover:bg-muted">Previous</Link>}
            {page < pages && <Link href={href({ page: page + 1 })} className="rounded-lg border px-3 py-1.5 hover:bg-muted">Next</Link>}
          </div>
        </nav>
      )}
    </div>
  )
}
