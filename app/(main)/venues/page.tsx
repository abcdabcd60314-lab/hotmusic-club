export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMemberByUserIdShort } from '@/lib/db/members'
import { getAllVenues } from '@/lib/db/facilities'
import VenuesClient from './VenuesClient'

export default async function VenuesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await getMemberByUserIdShort(supabase, user.id)
  if (!member) redirect('/login')

  const { data: venues } = await getAllVenues(supabase)

  return <VenuesClient venues={venues ?? []} member={member} />
}
