export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMemberByUserIdShort } from '@/lib/db/members'
import { getIncomeRecords, getExpenseRecords } from '@/lib/db/finance'
import FinanceClient from './FinanceClient'

export default async function FinancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: self } = await getMemberByUserIdShort(supabase, user.id)
  if (!self?.幹部權限) redirect('/dashboard')

  const [incomeRes, expenseRes] = await Promise.all([
    getIncomeRecords(supabase),
    getExpenseRecords(supabase),
  ])

  return (
    <FinanceClient
      initialIncome={incomeRes.data ?? []}
      initialExpense={expenseRes.data ?? []}
    />
  )
}
