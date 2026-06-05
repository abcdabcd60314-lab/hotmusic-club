export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMemberByUserIdShort } from '@/lib/db/members'
import { getAllEquipment } from '@/lib/db/equipment'
import EquipmentClient from './EquipmentClient'

export default async function EquipmentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await getMemberByUserIdShort(supabase, user.id)
  if (!member) redirect('/login')

  const { data: equipment } = await getAllEquipment(supabase)

  return <EquipmentClient equipment={equipment ?? []} member={member} />
}
