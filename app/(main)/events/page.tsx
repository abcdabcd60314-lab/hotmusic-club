import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMemberByUserIdShort } from '@/lib/db/members'
import { getAllEvents, getMyRegistrations } from '@/lib/db/events'
import EventsClient from './EventsClient'

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await getMemberByUserIdShort(supabase, user.id)
  if (!member) redirect('/login')

  const [eventsRes, registrationsRes] = await Promise.all([
    getAllEvents(supabase),
    getMyRegistrations(supabase, member.社員編號),
  ])

  return (
    <EventsClient
      events={eventsRes.data ?? []}
      myRegistrations={registrationsRes.data ?? []}
      member={member}
    />
  )
}
