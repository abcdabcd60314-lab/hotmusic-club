import type { SupabaseClient } from '@supabase/supabase-js'
type AnyClient = SupabaseClient<any>

export interface 設備Row {
  設備編號: number
  設備名稱: string
  數量: number
  狀態: string
}

export interface 設備預約Row {
  預約編號: number
  設備編號: number
  社員編號: number
  開始時間: string
  結束時間: string
  數量: number
  狀態: string
  建立時間: string
}

export async function getAllEquipment(supabase: AnyClient) {
  const res = await supabase.from('設備').select('*').order('設備編號')
  return res as { data: 設備Row[] | null; error: unknown }
}

export async function getEquipmentBookings(supabase: AnyClient, from: string, to: string) {
  const res = await supabase
    .from('設備預約')
    .select('*')
    .neq('狀態', '已取消')
    .gte('開始時間', from)
    .lte('開始時間', to)
  return res as { data: 設備預約Row[] | null; error: unknown }
}

export async function createEquipmentBooking(supabase: AnyClient, data: {
  設備編號: number
  社員編號: number
  開始時間: string
  結束時間: string
  數量: number
}) {
  const res = await supabase.from('設備預約').insert({ ...data, 狀態: '待確認' })
  return res as { error: unknown }
}

export async function cancelEquipmentBooking(supabase: AnyClient, id: number) {
  const res = await supabase.from('設備預約').update({ 狀態: '已取消' }).eq('預約編號', id)
  return res as { error: unknown }
}

export async function getMyEquipmentBookings(supabase: AnyClient, memberId: number) {
  const res = await supabase
    .from('設備預約')
    .select('*, 設備(設備名稱)')
    .eq('社員編號', memberId)
    .neq('狀態', '已取消')
    .order('開始時間', { ascending: false })
  return res as { data: (設備預約Row & { 設備: { 設備名稱: string } | null })[] | null; error: unknown }
}
