export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import DashboardStats from './DashboardStats'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [membersRes, eventsRes, repairsRes] = await Promise.all([
    supabase.from('社員').select('社員編號', { count: 'exact', head: true }).eq('狀態', '在籍'),
    supabase.from('活動').select('活動編號', { count: 'exact', head: true }),
    supabase.from('報修申請').select('報修編號', { count: 'exact', head: true }).eq('狀態', '待處理'),
  ])

  return (
    <DashboardStats
      memberCount={membersRes.count ?? 0}
      eventCount={eventsRes.count ?? 0}
      repairCount={repairsRes.count ?? 0}
    />
  )
}
