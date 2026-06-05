# 熱音社管理系統 — 開發進度紀錄

> 系統分析課程第七組專題，CS 大二，使用者：莊子寬（學號 13156204，資管系）

---

## 技術棧

| 項目 | 版本 |
|------|------|
| Next.js | 16.2.7（App Router，**不是** 15） |
| React | 19.2.4 |
| Ant Design | 6.4.3 |
| @ant-design/cssinjs | 2.1.2 |
| Supabase | `@supabase/ssr` |
| Tailwind CSS | v4 |
| 部署環境 | Windows 11，開發中（localhost:3001） |

---

## 重要已知問題與解法

### 1. Next.js 16 改用 `proxy.ts`（不是 `middleware.ts`）
- `middleware.ts` 已棄用，改成 `proxy.ts`
- export 函式名稱必須是 `proxy`（不是 `middleware`）

### 2. Ant Design + React 19 + Turbopack SSR 的 `createContext` 問題
**根本原因**：Turbopack 的 SSR bundle 使用 `react-server` 匯出條件，而 `react.react-server.js` 沒有 `createContext`。antd 在模組初始化時就呼叫 `React.createContext()`，導致崩潰。

**嘗試過但失敗的方法**：
- `serverExternalPackages: ['antd', ...]` → Turbopack 衝突
- `experimental.optimizePackageImports` 覆寫 → Next.js 從 hardcoded 預設值強制加回
- `AntdRegistry`（`@ant-design/nextjs-registry`）→ 無效
- `dynamic(() => import('...'), { ssr: false })` 在 server component → Next.js 不允許
- `resolveAlias: { react: './node_modules/react/index.js' }` → 對深層套件失效
- `resolveAlias: { react: 要求.resolve('react').replace(/\\/g, '/') }` → Turbopack 不支援 Windows 絕對路徑

**目前的解法（正確的架構）**：
> **Server component 不能直接 import antd！**
> 正確做法：server component 只做資料抓取，UI 全部放到標有 `'use client'` 的 client component。

### 3. Supabase 中文資料表名稱的 TypeScript 型別問題
- 直接用 `Database` generic → TypeScript 回傳 `never`
- **解法**：建立 `lib/db/members.ts`，用 `SupabaseClient<any>` 加上明確型別轉型

### 4. antd message 靜態方法不能繼承動態主題
- 錯誤：`[antd: message] Static function can not consume context`
- **解法**：在 `AntdProvider` 加 `<App>` 包住，並用 `App.useApp()` 取得 `message` 實例

---

## 資料庫（Supabase）

- **Project URL**: `https://ijsnoeffyfusentvbpau.supabase.co`
- **Project Ref**: `ijsnoeffyfusentvbpau`
- 資料表：18 個（社員、活動、活動報名、收入紀錄、支出紀錄、財務報表 等）
- **Migration 狀態**：`supabase_migration.sql` 已執行完成
  - 新增 `社員.user_id uuid`（連結 Supabase Auth）
  - 修正 `狀態` CHECK 加入 `'待審核'`，default 改為 `'待審核'`
  - 活動報名加 UNIQUE 約束
  - 財務報表.淨餘額 改為 GENERATED COLUMN
  - 移除收入/支出紀錄對財務報表的循環 FK
  - 建立 RLS policies（社員只能看自己；幹部可看全部）

---

## 環境變數（`.env.local`）

```
NEXT_PUBLIC_SUPABASE_URL=https://ijsnoeffyfusentvbpau.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqc25vZWZmeWZ1c2VudHZicGF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1ODYzMDcsImV4cCI6MjA5NjE2MjMwN30.pxLIv9_MpoMSRCkQykEeg9PxaatBL5DIrIUTiHhXWc8
```

---

## 已建立的檔案

### 設定
- `next.config.ts` — Turbopack resolveAlias（react → index.js，解決部分 SSR 問題）
- `proxy.ts` — 身分驗證 proxy（Next.js 16 替代 middleware）
- `.env.local` — Supabase 環境變數

### Supabase 客戶端
- `lib/supabase/client.ts` — 瀏覽器端 Supabase client
- `lib/supabase/server.ts` — 伺服器端 Supabase client（帶 cookie）
- `lib/types/database.ts` — TypeScript 型別定義（所有中文資料表）
- `lib/db/members.ts` — 社員資料庫操作 helpers

### 佈局元件
- `components/AntdProvider.tsx` — ConfigProvider + App（深色主題 + 橘色）
- `components/AppShell.tsx` — Layout + 側邊欄（client component）
- `components/MainSidebar.tsx` — 導覽側邊欄 + 登出
- `components/ClientShell.tsx` — 包裝 AppShell（dynamic ssr:false）

### 路由
- `app/layout.tsx` — 根 layout（AntdProvider）
- `app/(auth)/layout.tsx` — 認證頁 layout
- `app/(auth)/login/page.tsx` — 登入頁（Ant Design Form）
- `app/(auth)/register/page.tsx` — 申請入社頁（Ant Design Form）
- `app/(main)/layout.tsx` — 主應用 layout（server，驗證 + 取得社員資料）
- `app/(main)/dashboard/page.tsx` — 儀表板（server，只抓資料）
- `app/(main)/dashboard/DashboardStats.tsx` — 儀表板統計卡片（client）
- `app/(main)/members/page.tsx` — 社員列表（server）
- `app/(main)/members/MemberList.tsx` — 社員表格（client）
- `app/(main)/profile/page.tsx` — 個人資料（server）
- `app/(main)/profile/ProfileForm.tsx` — 個人資料表單（client）
- `app/(main)/events/page.tsx` — 活動管理（client，開發中）
- `app/(main)/facilities/page.tsx` — 場地設備（client，開發中）
- `app/(main)/finance/page.tsx` — 財務管理（server，幹部限定）
- `app/(main)/finance/FinanceClient.tsx` — 財務管理 UI（client，開發中）

---

## 目前狀態（2026-06-05）

### 已完成 ✅
- [x] 登入/註冊頁面（UI 正常，深色主題）
- [x] Supabase Auth 整合
- [x] proxy.ts 身分驗證保護
- [x] 社員資料庫 helpers
- [x] Dashboard 統計卡片
- [x] 社員列表（幹部限定）
- [x] 個人資料編輯
- [x] Migration SQL 執行完畢
- [x] `createContext` SSR 錯誤（在 server component 中的部分）已解決

### 待確認 ⚠️
- [ ] 使用者是否成功註冊（Supabase Auth + 社員記錄）
  - 去 Supabase Dashboard → Authentication → Users 確認
  - 如果 auth user 存在但 社員 表沒有記錄，需要手動 INSERT
- [ ] Email 確認是否已關閉（Authentication → Sign In / Providers → Email → 關閉 "Confirm email"）

### 待開發 📋
- [ ] 活動管理（完整 CRUD）
- [ ] 場地設備管理
- [ ] 財務管理（收入/支出）
- [ ] 報修申請
- [ ] 幹部審核申請功能（在社員列表裡審核「待審核」狀態）

---

## 架構規則（重要！）

```
✅ 正確模式：
  app/(main)/xxx/page.tsx          ← server component，只抓資料，不 import antd
  app/(main)/xxx/XxxClient.tsx     ← 'use client'，import antd，接收 props 渲染

❌ 錯誤（會爆 createContext error）：
  app/(main)/xxx/page.tsx 直接 import { Button } from 'antd'
```

---

## 啟動方式

```bash
cd "C:\Users\User\Documents\社團管理系統\web"
npm run dev
# 瀏覽器開 http://localhost:3001
```

如果 port 被佔用先執行：
```powershell
Stop-Process -Name "node" -Force
```
