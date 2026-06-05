export type MemberStatus = '在籍' | '離社' | '待審核'
export type MemberPosition = '一般社員' | '幹部' | '教學'
export type OfficerTitle = '社長' | '副社長' | '財務長' | '器材組長' | '活動組長' | '公關組長'
export type InstructorStatus = '合作中' | '暫停' | '結束'
export type EventType = '表演' | '活動'

export interface 社員Row {
  社員編號: number
  姓名: string
  學號: string
  電子郵件: string
  手機號碼: string | null
  密碼雜湊: string
  樂器: string | null
  加入日期: string
  狀態: MemberStatus
  建立時間: string
  科系: string | null
  幹部權限: boolean
  職位: MemberPosition | null
  user_id: string | null
}

export type 社員Insert = {
  姓名: string
  學號: string
  電子郵件: string
  密碼雜湊: string
  手機號碼?: string | null
  樂器?: string | null
  加入日期?: string
  狀態?: MemberStatus
  科系?: string | null
  幹部權限?: boolean
  職位?: MemberPosition | null
  user_id?: string | null
}

export type 社員Update = Partial<Omit<社員Row, '社員編號' | '建立時間'>>

export interface 幹部Row {
  幹部編號: number
  社員編號: number
  職稱: OfficerTitle
  任期開始: string
  任期結束: string | null
}

export interface 教學Row {
  教學編號: number
  姓名: string
  手機號碼: string | null
  電子郵件: string | null
  教學樂器: string
  狀態: InstructorStatus
}

export interface 活動Row {
  活動編號: number
  活動名稱: string
  活動類型: EventType
  說明: string | null
  活動時間: string
  地點: string | null
  報名截止: string | null
  人數上限: number | null
  建立時間: string
  主辦幹部編號: number | null
}

export interface 活動報名Row {
  報名編號: number
  活動編號: number
  社員編號: number
  報名時間: string
  狀態: '已確認' | '已取消'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = { Row: any; Insert: any; Update: any; Relationships: any[] }

export type Database = {
  public: {
    Tables: {
      社員: {
        Row: 社員Row
        Insert: 社員Insert
        Update: 社員Update
        Relationships: []
      }
      幹部: {
        Row: 幹部Row
        Insert: 幹部Row
        Update: Partial<幹部Row>
        Relationships: []
      }
      教學: {
        Row: 教學Row
        Insert: 教學Row
        Update: Partial<教學Row>
        Relationships: []
      }
      活動: {
        Row: 活動Row
        Insert: Omit<活動Row, '活動編號' | '建立時間'>
        Update: Partial<活動Row>
        Relationships: []
      }
      活動報名: {
        Row: 活動報名Row
        Insert: Omit<活動報名Row, '報名編號' | '報名時間'>
        Update: Partial<活動報名Row>
        Relationships: []
      }
      報修申請: AnyTable
      財務報表: AnyTable
      收入紀錄: AnyTable
      支出紀錄: AnyTable
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
