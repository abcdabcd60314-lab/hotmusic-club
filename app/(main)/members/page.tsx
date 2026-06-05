export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMemberByUserIdShort, getAllMembers } from '@/lib/db/members'
import MemberList from './MemberList'

export default async function MembersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: self } = await getMemberByUserIdShort(supabase, user.id)
  if (!self?.幹部權限) redirect('/profile')

  const { data: members } = await getAllMembers(supabase)

  return <MemberList initialMembers={members ?? []} />
}
