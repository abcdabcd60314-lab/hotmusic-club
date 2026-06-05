import type { SupabaseClient } from '@supabase/supabase-js'
type AnyClient = SupabaseClient<any>

export interface 收入紀錄Row {
  記錄編號: number
  幹部編號: number | null
  金額: number
  類別: string
  說明: string | null
  日期: string
  建立時間: string
}

export interface 支出紀錄Row {
  記錄編號: number
  幹部編號: number | null
  金額: number
  類別: string
  說明: string | null
  日期: string
  建立時間: string
}

export async function getIncomeRecords(supabase: AnyClient) {
  const res = await supabase.from('收入紀錄').select('記錄編號,金額,類別,說明,日期,建立時間').order('日期', { ascending: false })
  return res as { data: 收入紀錄Row[] | null; error: unknown }
}

export async function getExpenseRecords(supabase: AnyClient) {
  const res = await supabase.from('支出紀錄').select('記錄編號,金額,類別,說明,日期,建立時間').order('日期', { ascending: false })
  return res as { data: 支出紀錄Row[] | null; error: unknown }
}

export async function addIncomeRecord(supabase: AnyClient, data: { 金額: number; 類別: string; 說明?: string | null; 日期: string }) {
  const res = await supabase.from('收入紀錄').insert(data)
  return res as { error: unknown }
}

export async function addExpenseRecord(supabase: AnyClient, data: { 金額: number; 類別: string; 說明?: string | null; 日期: string }) {
  const res = await supabase.from('支出紀錄').insert(data)
  return res as { error: unknown }
}
