import type { SupabaseClient } from '@supabase/supabase-js'
type AnyClient = SupabaseClient<any>

export interface 教學時段Row {
  時段編號: number
  教師社員編號: number
  開始時間: string
  結束時間: string
  建立時間: string
  社員?: { 姓名: string; 樂器: string | null } | null
}

export interface 教學預約Row {
  預約編號: number
  時段編號: number
  學員社員編號: number
  狀態: string
  建立時間: string
  教學時段?: { 開始時間: string; 結束時間: string; 教師社員編號: number; 社員?: { 姓名: string } | null } | null
  社員?: { 姓名: string } | null
}

export async function getTeachingSlots(supabase: AnyClient, from: string, to: string) {
  const res = await supabase
    .from('教學時段')
    .select('*, 社員(姓名, 樂器)')
    .gte('開始時間', from)
    .lte('開始時間', to)
  return res as { data: 教學時段Row[] | null; error: unknown }
}

export async function getMyTeachingSlots(supabase: AnyClient, teacherId: number) {
  const res = await supabase
    .from('教學時段')
    .select('*')
    .eq('教師社員編號', teacherId)
    .order('開始時間', { ascending: false })
  return res as { data: 教學時段Row[] | null; error: unknown }
}

export async function addTeachingSlot(supabase: AnyClient, data: {
  教師社員編號: number
  開始時間: string
  結束時間: string
}) {
  const res = await supabase.from('教學時段').insert(data)
  return res as { error: unknown }
}

export async function deleteTeachingSlot(supabase: AnyClient, id: number) {
  const res = await supabase.from('教學時段').delete().eq('時段編號', id)
  return res as { error: unknown }
}

export async function createTeachingBooking(supabase: AnyClient, data: {
  時段編號: number
  學員社員編號: number
}) {
  const res = await supabase.from('教學預約').insert({ ...data, 狀態: '待確認' })
  return res as { error: unknown }
}

export async function getMyTeachingBookings(supabase: AnyClient, memberId: number) {
  const res = await supabase
    .from('教學預約')
    .select('*, 教學時段(開始時間, 結束時間, 教師社員編號, 社員(姓名))')
    .eq('學員社員編號', memberId)
    .order('建立時間', { ascending: false })
  return res as { data: 教學預約Row[] | null; error: unknown }
}

export async function getTeacherBookings(supabase: AnyClient, teacherId: number) {
  const res = await supabase
    .from('教學預約')
    .select('*, 教學時段!inner(教師社員編號), 社員(姓名)')
    .eq('教學時段.教師社員編號', teacherId)
    .order('建立時間', { ascending: false })
  return res as { data: 教學預約Row[] | null; error: unknown }
}

export async function getAllTeachers(supabase: AnyClient) {
  const res = await supabase
    .from('社員')
    .select('社員編號, 姓名, 樂器')
    .eq('職位', '教學')
    .eq('狀態', '在籍')
  return res as { data: { 社員編號: number; 姓名: string; 樂器: string | null }[] | null; error: unknown }
}
