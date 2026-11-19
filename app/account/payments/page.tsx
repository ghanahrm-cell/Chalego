import { TransactionList } from '@/components/account/transaction-list'
import type { Transaction } from '@/lib/account'
import { requireUser } from '@/lib/session'

export const metadata = { title: 'Payments | CHALEGO' }

export default async function PaymentsPage() {
  const { supabase, user, country } = await requireUser('/account/payments')
  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, amount, currency, division, payment_type, provider, reference, status, description, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)
    .returns<Transaction[]>()

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Payments</h1>
        <p className="mt-1 text-muted-foreground">Receipts for every booking across all CHALEGO services.</p>
      </header>
      <TransactionList transactions={transactions ?? []} locale={country?.locale ?? 'en-GH'} />
    </div>
  )
}
