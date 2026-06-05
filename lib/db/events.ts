import type { SupabaseClient } from '@supabase/supabase-js'
import type { 活動Row, 活動報名Row } from '@/lib/types/database'
type AnyClient = SupabaseClient<any>

export async function getAllEvents(supabase: AnyClient) {
  const res = await supabase.from('活動').select('*').order('活動時間', { ascending: false })
  return res as { data: 活動Row[] | null; error: unknown }
}

export async function getMyRegistrations(supabase: AnyClient, memberId: number) {
  const res = await supabase.from('活動報名').select('*').eq('社員編號', memberId)
  return res as { data: 活動報名Row[] | null; error: unknown }
}

export async function createEvent(supabase: AnyClient, data: {
  活動名稱: string
  活動類型: '表演' | '活動'
  說明?: string | null
  活動時間: string
  地點?: string | null
  報名截止?: string | null
  人數上限?: number | null
}) {
  const res = await supabase.from('活動').insert(data)
  return res as { error: unknown }
}

export async function registerEvent(supabase: AnyClient, 活動編號: number, 社員編號: number) {
  const res = await supabase.from('活動報名').insert({ 活動編號, 社員編號, 狀態: '已確認' })
  return res as { error: unknown }
}

export async function cancelRegistration(supabase: AnyClient, 報名編號: number) {
  const res = await supabase.from('活動報名').delete().eq('報名編號', 報名編號)
  return res as { error: unknown }
}
