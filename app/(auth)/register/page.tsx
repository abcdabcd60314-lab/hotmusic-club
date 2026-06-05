'use client'

import { useState } from 'react'
import { App, Form, Input, Button, Card, Typography, Select } from 'antd'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { insertMember } from '@/lib/db/members'
import Link from 'next/link'

const { Title, Text } = Typography
const { Option } = Select

const INSTRUMENTS = ['吉他', '貝斯', '鼓', '鍵盤', '主唱', '其他']

interface FormValues {
  email: string
  password: string
  confirm: string
  姓名: string
  學號: string
  手機號碼?: string
  科系?: string
  樂器?: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm<FormValues>()
  const supabase = createClient()
  const { message } = App.useApp()

  async function onFinish(values: FormValues) {
    if (values.password !== values.confirm) {
      message.error('兩次密碼輸入不一致')
      return
    }

    setLoading(true)

    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })

    if (authError || !authData.user) {
      setLoading(false)
      message.error(authError?.message ?? '註冊失敗，請稍後再試')
      return
    }

    // 2. Insert 社員 record
    const { error: memberError } = await insertMember(supabase, {
      姓名: values.姓名,
      學號: values.學號,
      電子郵件: values.email,
      手機號碼: values.手機號碼 || null,
      科系: values.科系 || null,
      樂器: values.樂器 || null,
      密碼雜湊: '',
      狀態: '待審核',
      幹部權限: false,
      user_id: authData.user.id,
    })

    setLoading(false)

    if (memberError) {
      message.error('建立社員資料失敗：' + (memberError as { message: string }).message)
      return
    }

    message.success('申請成功！請等候幹部審核，並確認電子郵件。')
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-8">
      <Card className="w-full max-w-lg" style={{ background: '#1f2937', border: '1px solid #374151' }}>
        <div className="text-center mb-6">
          <Title level={3} style={{ color: '#f97316', margin: 0 }}>🎸 申請加入熱音社</Title>
          <Text style={{ color: '#9ca3af' }}>填寫以下資料完成入社申請</Text>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} size="large">
          <Form.Item label={<span style={{ color: '#d1d5db' }}>姓名</span>} name="姓名" rules={[{ required: true, message: '請輸入姓名' }]}>
            <Input placeholder="請輸入真實姓名" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label={<span style={{ color: '#d1d5db' }}>學號</span>} name="學號" rules={[{ required: true, message: '請輸入學號' }]}>
              <Input placeholder="學號" />
            </Form.Item>
            <Form.Item label={<span style={{ color: '#d1d5db' }}>科系</span>} name="科系">
              <Input placeholder="科系（選填）" />
            </Form.Item>
          </div>

          <Form.Item label={<span style={{ color: '#d1d5db' }}>電子郵件</span>} name="email" rules={[{ required: true, type: 'email', message: '請輸入有效電子郵件' }]}>
            <Input placeholder="email@example.com" />
          </Form.Item>

          <Form.Item label={<span style={{ color: '#d1d5db' }}>手機號碼</span>} name="手機號碼">
            <Input placeholder="09XXXXXXXX（選填）" />
          </Form.Item>

          <Form.Item label={<span style={{ color: '#d1d5db' }}>擅長樂器</span>} name="樂器">
            <Select placeholder="選擇樂器（選填）" allowClear>
              {INSTRUMENTS.map(i => <Option key={i} value={i}>{i}</Option>)}
            </Select>
          </Form.Item>

          <Form.Item label={<span style={{ color: '#d1d5db' }}>密碼</span>} name="password" rules={[{ required: true, min: 6, message: '密碼至少 6 個字元' }]}>
            <Input.Password placeholder="設定密碼（至少 6 字元）" />
          </Form.Item>

          <Form.Item label={<span style={{ color: '#d1d5db' }}>確認密碼</span>} name="confirm" rules={[{ required: true, message: '請再次輸入密碼' }]}>
            <Input.Password placeholder="再次輸入密碼" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              送出申請
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center">
          <Text style={{ color: '#9ca3af' }}>已有帳號？</Text>{' '}
          <Link href="/login" style={{ color: '#f97316' }}>返回登入</Link>
        </div>
      </Card>
    </div>
  )
}
