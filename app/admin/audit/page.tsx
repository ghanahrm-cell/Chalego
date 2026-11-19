import { requireAdmin } from '@/lib/session'

type AuditRow = { id: number; actor_id: string | null; action: string; entity: string; entity_id: string | null; created_at: string }

export default async function AdminAuditPage() {
  const { supabase } = await requireAdmin()
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('id, actor_id, action, entity, entity_id, created_at')
    .order('created_at', { ascending: false })
    .limit(100)
    .returns<AuditRow[]>()

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Audit log</h1>
        <p className="mt-1 text-muted-foreground">The latest 100 configuration changes.</p>
      </header>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50 text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">When</th>
              <th scope="col" className="px-4 py-3 font-medium">Action</th>
              <th scope="col" className="px-4 py-3 font-medium">Entity</th>
              <th scope="col" className="px-4 py-3 font-medium">Record</th>
              <th scope="col" className="px-4 py-3 font-medium">Actor</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(logs ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No changes recorded yet.</td>
              </tr>
            ) : (
              logs!.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap px-4 py-3">{new Date(l.created_at).toLocaleString('en-GB')}</td>
                  <td className="px-4 py-3 capitalize">{l.action}</td>
                  <td className="px-4 py-3">{l.entity.replaceAll('_', ' ')}</td>
                  <td className="px-4 py-3 font-mono text-xs">{l.entity_id?.slice(0, 8)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{l.actor_id ? l.actor_id.slice(0, 8) : 'system'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
