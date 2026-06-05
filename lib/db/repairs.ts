import type { SupabaseClient } from '@supabase/supabase-js'
type AnyClient = SupabaseClient<any>

export type RepairStatus = '待處理' | '處理中' | '已完成'

export interface 報修申請Row {
  報修編號: number
  社員編號: number
  設備名稱: string
  問題描述: string
  狀態: RepairStatus
  建立時間: string
  社員?: { 姓名: string } | null
}

export async function getMyRepairs(supabase: AnyClient, memberId: number) {
  const res = await supabase
    .from('報修申請')
    .select('*')
    .eq('社員編號', memberId)
    .order('建立時間', { ascending: false })
  return res as { data: 報修申請Row[] | null; error: unknown }
}

export async function getAllRepairs(supabase: AnyClient) {
  const res = await supabase
    .from('報修申請')
    .select('*, 社員(姓名)')
    .order('建立時間', { ascending: false })
  return res as { data: 報修申請Row[] | null; error: unknown }
}

export async function createRepair(supabase: AnyClient, data: {
  社員編號: number
  設備名稱: string
  問題描述: string
}) {
  const res = await supabase.from('報修申請').insert({ ...data, 狀態: '待處理' })
  return res as { error: unknown }
}

export async function updateRepairStatus(supabase: AnyClient, id: number, 狀態: RepairStatus) {
  const res = await supabase.from('報修申請').update({ 狀態 }).eq('報修編號', id)
  return res as { error: unknown }
}
