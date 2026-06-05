'use client'

import { useState } from 'react'
import { App, Form, Input, Button, Card, Typography } from 'antd'
import { MailOutlined, LockOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const { Title, Text } = Typography

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { message } = App.useApp()

  async function onFinish(values: { email: string; password: string }) {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    setLoading(false)

    if (error) {
      message.error(error.message === 'Invalid login credentials' ? '帳號或密碼錯誤' : error.message)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <Card className="w-full max-w-sm" style={{ background: '#1f2937', border: '1px solid #374151' }}>
        <div className="text-center mb-6">
          <Title level={3} style={{ color: '#f97316', margin: 0 }}>🎸 熱音社管理系統</Title>
          <Text style={{ color: '#9ca3af' }}>登入你的帳號</Text>
        </div>

        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '請輸入電子郵件' },
              { type: 'email', message: '請輸入有效的電子郵件' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="電子郵件" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '請輸入密碼' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密碼" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登入
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center">
          <Text style={{ color: '#9ca3af' }}>還沒有帳號？</Text>{' '}
          <Link href="/register" style={{ color: '#f97316' }}>申請加入</Link>
        </div>
      </Card>
    </div>
  )
}
