export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAllTeachers } from '@/lib/db/teaching'
import TeachingClient from './TeachingClient'

export default async function TeachingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('社員')
    .select('社員編號, 姓名, 狀態, 幹部權限, 職位')
    .eq('user_id', user.id)
    .single()
  if (!member) redirect('/login')

  const { data: teachers } = await getAllTeachers(supabase)

  return <TeachingClient member={member as unknown as { 社員編號: number; 姓名: string; 幹部權限: boolean; 職位: string | null }} teachers={teachers ?? []} />
}
