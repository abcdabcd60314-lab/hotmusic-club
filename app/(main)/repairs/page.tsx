export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMemberByUserIdShort } from '@/lib/db/members'
import { getMyRepairs, getAllRepairs } from '@/lib/db/repairs'
import RepairsClient from './RepairsClient'

export default async function RepairsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await getMemberByUserIdShort(supabase, user.id)
  if (!member) redirect('/login')

  const [myRes, allRes] = await Promise.all([
    getMyRepairs(supabase, member.社員編號),
    member.幹部權限 ? getAllRepairs(supabase) : Promise.resolve({ data: null }),
  ])

  return (
    <RepairsClient
      myRepairs={myRes.data ?? []}
      allRepairs={allRes.data ?? []}
      member={member}
    />
  )
}
