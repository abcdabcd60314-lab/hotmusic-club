import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMemberByUserIdShort } from '@/lib/db/members'
import ClientShell from '@/components/ClientShell'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: member } = await getMemberByUserIdShort(supabase, user.id)

  if (!member) redirect('/login')

  return (
    <ClientShell member={member}>
      {children}
    </ClientShell>
  )
}
