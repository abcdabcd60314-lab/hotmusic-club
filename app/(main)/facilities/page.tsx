import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMemberByUserIdShort } from '@/lib/db/members'
import { getAllVenues, getMyReservations, getAllReservations } from '@/lib/db/facilities'
import FacilitiesClient from './FacilitiesClient'

export default async function FacilitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await getMemberByUserIdShort(supabase, user.id)
  if (!member) redirect('/login')

  const [venuesRes, myResRes, allResRes] = await Promise.all([
    getAllVenues(supabase),
    getMyReservations(supabase, member.社員編號),
    member.幹部權限 ? getAllReservations(supabase) : Promise.resolve({ data: null }),
  ])

  return (
    <FacilitiesClient
      venues={venuesRes.data ?? []}
      myReservations={myResRes.data ?? []}
      allReservations={allResRes.data ?? []}
      member={member}
    />
  )
}
