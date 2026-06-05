-- ============================================================
-- 新增場地、設備、教學預約系統
-- 在 Supabase SQL Editor 執行
-- ============================================================

-- 1. 社員加入職位欄位
ALTER TABLE public.社員
  ADD COLUMN IF NOT EXISTS 職位 text DEFAULT '一般社員'
  CHECK (職位 IN ('一般社員', '幹部', '教學'));

-- 2. 場地表（若不存在才建）
CREATE TABLE IF NOT EXISTS public.場地 (
  場地編號  serial PRIMARY KEY,
  場地名稱  text NOT NULL,
  位置     text,
  容納人數  integer DEFAULT 1,
  狀態     text DEFAULT '可使用' CHECK (狀態 IN ('可使用', '維修中', '停用')),
  建立時間  timestamptz DEFAULT now()
);

-- 預設場地
INSERT INTO public.場地 (場地名稱, 位置, 容納人數) VALUES
  ('社辦', '學生活動中心 3F', 10),
  ('練團室', '學生活動中心 B1', 20)
ON CONFLICT DO NOTHING;

-- 3. 場地預約（原 facilities 可能已有，需判斷）
CREATE TABLE IF NOT EXISTS public.場地預約 (
  預約編號  serial PRIMARY KEY,
  場地編號  integer NOT NULL REFERENCES public.場地(場地編號),
  社員編號  integer NOT NULL REFERENCES public.社員(社員編號),
  開始時間  timestamptz NOT NULL,
  結束時間  timestamptz NOT NULL,
  用途     text,
  狀態     text DEFAULT '待確認' CHECK (狀態 IN ('待確認', '已確認', '已取消')),
  建立時間  timestamptz DEFAULT now()
);

ALTER TABLE public.場地預約 DISABLE ROW LEVEL SECURITY;

-- 4. 設備表
CREATE TABLE IF NOT EXISTS public.設備 (
  設備編號  serial PRIMARY KEY,
  設備名稱  text NOT NULL,
  數量     integer NOT NULL DEFAULT 1,
  狀態     text DEFAULT '可使用' CHECK (狀態 IN ('可使用', '維修中', '停用')),
  建立時間  timestamptz DEFAULT now()
);

-- 預設設備清單
INSERT INTO public.設備 (設備名稱, 數量) VALUES
  ('吉他', 2),
  ('吉他音箱', 2),
  ('貝斯', 1),
  ('貝斯音箱', 1),
  ('爵士鼓', 1),
  ('麥克風', 2),
  ('鍵盤', 1)
ON CONFLICT DO NOTHING;

-- 5. 設備預約
CREATE TABLE IF NOT EXISTS public.設備預約 (
  預約編號  serial PRIMARY KEY,
  設備編號  integer NOT NULL REFERENCES public.設備(設備編號),
  社員編號  integer NOT NULL REFERENCES public.社員(社員編號),
  開始時間  timestamptz NOT NULL,
  結束時間  timestamptz NOT NULL,
  數量     integer NOT NULL DEFAULT 1,
  狀態     text DEFAULT '待確認' CHECK (狀態 IN ('待確認', '已確認', '已取消')),
  建立時間  timestamptz DEFAULT now()
);

ALTER TABLE public.設備預約 DISABLE ROW LEVEL SECURITY;

-- 6. 教學時段
CREATE TABLE IF NOT EXISTS public.教學時段 (
  時段編號       serial PRIMARY KEY,
  教師社員編號   integer NOT NULL REFERENCES public.社員(社員編號),
  開始時間       timestamptz NOT NULL,
  結束時間       timestamptz NOT NULL,
  建立時間       timestamptz DEFAULT now()
);

ALTER TABLE public.教學時段 DISABLE ROW LEVEL SECURITY;

-- 7. 教學預約
CREATE TABLE IF NOT EXISTS public.教學預約 (
  預約編號     serial PRIMARY KEY,
  時段編號     integer NOT NULL REFERENCES public.教學時段(時段編號),
  學員社員編號 integer NOT NULL REFERENCES public.社員(社員編號),
  狀態        text DEFAULT '待確認' CHECK (狀態 IN ('待確認', '已確認', '已取消')),
  建立時間     timestamptz DEFAULT now(),
  UNIQUE (時段編號, 學員社員編號)
);

ALTER TABLE public.教學預約 DISABLE ROW LEVEL SECURITY;
