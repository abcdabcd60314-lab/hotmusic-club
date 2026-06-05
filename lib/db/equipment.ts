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
  借出時間: string
  歸還時間: string
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
    .not('狀態', 'in', '("已拒絕","已歸還")')
    .gte('借出時間', from)
    .lte('借出時間', to)
  return res as { data: 設備預約Row[] | null; error: unknown }
}

export async function createEquipmentBooking(supabase: AnyClient, data: {
  設備編號: number
  社員編號: number
  借出時間: string
  歸還時間: string
}) {
  const res = await supabase.from('設備預約').insert({ ...data, 狀態: '待審核' })
  return res as { error: unknown }
}

export async function cancelEquipmentBooking(supabase: AnyClient, id: number) {
  const res = await supabase.from('設備預約').update({ 狀態: '已拒絕' }).eq('預約編號', id)
  return res as { error: unknown }
}

export async function getMyEquipmentBookings(supabase: AnyClient, memberId: number) {
  const res = await supabase
    .from('設備預約')
    .select('*, 設備(設備名稱)')
    .eq('社員編號', memberId)
    .not('狀態', 'in', '("已拒絕","已歸還")')
    .order('借出時間', { ascending: false })
  return res as { data: (設備預約Row & { 設備: { 設備名稱: string } | null })[] | null; error: unknown }
}
