import type { SupabaseClient } from '@supabase/supabase-js'
import type { 社員Row, 社員Insert, 社員Update, MemberStatus, MemberPosition } from '@/lib/types/database'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any>

export async function getMemberByUserId(supabase: AnyClient, userId: string) {
  const res = await supabase
    .from('社員')
    .select('社員編號, 姓名, 學號, 電子郵件, 手機號碼, 樂器, 科系, 加入日期, 狀態, 幹部權限, user_id')
    .eq('user_id', userId)
    .single()
  return res as { data: 社員Row | null; error: unknown }
}

export async function getMemberByUserIdShort(supabase: AnyClient, userId: string) {
  const res = await supabase
    .from('社員')
    .select('社員編號, 姓名, 狀態, 幹部權限')
    .eq('user_id', userId)
    .single()
  return res as { data: Pick<社員Row, '社員編號' | '姓名' | '狀態' | '幹部權限'> | null; error: unknown }
}

export async function getAllMembers(supabase: AnyClient) {
  const res = await supabase
    .from('社員')
    .select('社員編號, 姓名, 學號, 電子郵件, 手機號碼, 樂器, 科系, 加入日期, 狀態, 幹部權限, 職位')
    .order('加入日期', { ascending: false })
  return res as { data: Omit<社員Row, '密碼雜湊' | '建立時間' | 'user_id'>[] | null; error: unknown }
}

export async function insertMember(supabase: AnyClient, data: 社員Insert) {
  const res = await supabase.from('社員').insert(data)
  return res as { data: null; error: { message: string } | null }
}

export async function updateMemberStatus(supabase: AnyClient, id: number, status: MemberStatus) {
  const res = await supabase.from('社員').update({ 狀態: status }).eq('社員編號', id)
  return res as { data: null; error: { message: string } | null }
}

export async function updateMemberPosition(supabase: AnyClient, id: number, 職位: MemberPosition) {
  const 幹部權限 = 職位 === '幹部' || 職位 === '教學'
  const res = await supabase.from('社員').update({ 職位, 幹部權限 }).eq('社員編號', id)
  return res as { data: null; error: { message: string } | null }
}

export async function updateMemberOfficer(supabase: AnyClient, id: number, 幹部權限: boolean) {
  const res = await supabase.from('社員').update({ 幹部權限 }).eq('社員編號', id)
  return res as { data: null; error: { message: string } | null }
}

export async function updateMemberProfile(supabase: AnyClient, id: number, data: 社員Update) {
  const res = await supabase.from('社員').update(data).eq('社員編號', id)
  return res as { data: null; error: { message: string } | null }
}
