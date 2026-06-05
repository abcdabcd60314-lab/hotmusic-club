-- ============================================================
-- 熱音社管理系統 — Schema 修正 Migration
-- 在 Supabase SQL Editor 執行此檔案
-- ============================================================

-- 1. 新增 user_id 欄位連結 Supabase Auth
ALTER TABLE public.社員
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS 社員_user_id_unique ON public.社員(user_id)
  WHERE user_id IS NOT NULL;

-- 2. 新增 '待審核' 狀態（需先刪除舊 CHECK constraint，再建新的）
ALTER TABLE public.社員 DROP CONSTRAINT IF EXISTS "社員_狀態_check";
ALTER TABLE public.社員
  ADD CONSTRAINT "社員_狀態_check"
  CHECK ("狀態" = ANY (ARRAY['在籍'::text, '離社'::text, '待審核'::text]));

-- 更新 DEFAULT 為待審核
ALTER TABLE public.社員 ALTER COLUMN 狀態 SET DEFAULT '待審核';

-- 3. 修正 活動報名 缺少 UNIQUE 約束（防止重複報名）
ALTER TABLE public.活動報名
  ADD CONSTRAINT IF NOT EXISTS 不得重複報名 UNIQUE (活動編號, 社員編號);

-- 4. 修正 財務報表.淨餘額 使用 GENERATED COLUMN
--    （若原本是 DEFAULT，需重建欄位）
ALTER TABLE public.財務報表 DROP COLUMN IF EXISTS 淨餘額;
ALTER TABLE public.財務報表
  ADD COLUMN 淨餘額 numeric GENERATED ALWAYS AS (總收入 - 總支出) STORED;

-- 5. 修正 收入紀錄 / 支出紀錄 移除對 財務報表 的 FK
--    （財務報表應由日期範圍動態計算，不應有 FK）
ALTER TABLE public.收入紀錄 DROP CONSTRAINT IF EXISTS 收入紀錄_報表編號_fkey;
ALTER TABLE public.收入紀錄 DROP COLUMN IF EXISTS 報表編號;

ALTER TABLE public.支出紀錄 DROP CONSTRAINT IF EXISTS 支出紀錄_報表編號_fkey;
ALTER TABLE public.支出紀錄 DROP COLUMN IF EXISTS 報表編號;

-- ============================================================
-- RLS Policies
-- ============================================================

-- Enable RLS
ALTER TABLE public.社員 ENABLE ROW LEVEL SECURITY;

-- 自己可以看自己的資料
DROP POLICY IF EXISTS "社員可讀自己" ON public.社員;
CREATE POLICY "社員可讀自己"
  ON public.社員 FOR SELECT
  USING (auth.uid() = user_id);

-- 幹部可以看所有社員
DROP POLICY IF EXISTS "幹部可讀全部社員" ON public.社員;
CREATE POLICY "幹部可讀全部社員"
  ON public.社員 FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.社員 s
      WHERE s.user_id = auth.uid() AND s.幹部權限 = true
    )
  );

-- 自己可以更新自己的部分欄位
DROP POLICY IF EXISTS "社員可更新自己" ON public.社員;
CREATE POLICY "社員可更新自己"
  ON public.社員 FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 幹部可以更新所有社員
DROP POLICY IF EXISTS "幹部可更新社員" ON public.社員;
CREATE POLICY "幹部可更新社員"
  ON public.社員 FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.社員 s
      WHERE s.user_id = auth.uid() AND s.幹部權限 = true
    )
  );

-- 允許 INSERT（新社員申請）
DROP POLICY IF EXISTS "允許新社員申請" ON public.社員;
CREATE POLICY "允許新社員申請"
  ON public.社員 FOR INSERT
  WITH CHECK (auth.uid() = user_id);
