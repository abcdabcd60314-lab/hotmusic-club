import type { SupabaseClient } from '@supabase/supabase-js'
type AnyClient = SupabaseClient<any>

export interface 場地Row {
  場地編號: number
  場地名稱: string
  位置: string | null
  容納人數: number | null
  狀態: string
}

export interface 場地預約Row {
  預約編號: number
  場地編號: number
  社員編號: number
  開始時間: string
  結束時間: string
  用途: string | null
  狀態: string
  建立時間: string
  場地?: { 場地名稱: string } | null
}

export async function getAllVenues(supabase: AnyClient) {
  const res = await supabase.from('場地').select('*').order('場地編號')
  return res as { data: 場地Row[] | null; error: unknown }
}

export async function getMyReservations(supabase: AnyClient, memberId: number) {
  const res = await supabase
    .from('場地預約')
    .select('*, 場地(場地名稱)')
    .eq('社員編號', memberId)
    .order('開始時間', { ascending: false })
  return res as { data: 場地預約Row[] | null; error: unknown }
}

export async function getAllReservations(supabase: AnyClient) {
  const res = await supabase
    .from('場地預約')
    .select('*, 場地(場地名稱)')
    .order('開始時間', { ascending: false })
  return res as { data: 場地預約Row[] | null; error: unknown }
}

export async function createReservation(supabase: AnyClient, data: {
  場地編號: number
  社員編號: number
  開始時間: string
  結束時間: string
  用途?: string | null
}) {
  const res = await supabase.from('場地預約').insert({ ...data, 狀態: '待確認' })
  return res as { error: unknown }
}

export async function updateReservationStatus(supabase: AnyClient, 預約編號: number, 狀態: string) {
  const res = await supabase.from('場地預約').update({ 狀態 }).eq('預約編號', 預約編號)
  return res as { error: unknown }
}
