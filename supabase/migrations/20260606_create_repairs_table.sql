CREATE TABLE IF NOT EXISTS "報修申請" (
  "報修編號"   SERIAL PRIMARY KEY,
  "社員編號"   INTEGER NOT NULL REFERENCES "社員"("社員編號"),
  "設備名稱"   TEXT NOT NULL,
  "問題描述"   TEXT NOT NULL,
  "狀態"       TEXT NOT NULL DEFAULT '待處理'
                 CHECK ("狀態" IN ('待處理', '處理中', '已完成')),
  "建立時間"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
