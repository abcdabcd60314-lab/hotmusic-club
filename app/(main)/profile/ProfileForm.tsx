'use client'

import { useState } from 'react'
import { Form, Input, Select, Button, Card, Typography, Tag, Descriptions, message } from 'antd'
import { createClient } from '@/lib/supabase/client'
import { updateMemberProfile } from '@/lib/db/members'
import type { 社員Row, MemberStatus } from '@/lib/types/database'

const { Title, Text } = Typography
const { Option } = Select

const INSTRUMENTS = ['吉他', '貝斯', '鼓', '鍵盤', '主唱', '其他']

const STATUS_COLORS: Record<MemberStatus, string> = {
  '在籍': 'green',
  '待審核': 'orange',
  '離社': 'red',
}

interface FormValues {
  手機號碼?: string
  樂器?: string
  科系?: string
}

export default function ProfileForm({ member }: { member: 社員Row }) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function onFinish(values: FormValues) {
    setLoading(true)
    const { error } = await updateMemberProfile(supabase, member.社員編號, {
      手機號碼: values.手機號碼 || null,
      樂器: values.樂器 || null,
      科系: values.科系 || null,
    })
    setLoading(false)

    if (error) { message.error('更新失敗：' + (error as { message: string }).message); return }
    message.success('個人資料已更新')
  }

  return (
    <div className="max-w-2xl">
      <Title level={3} style={{ color: '#f3f4f6', marginBottom: 24 }}>個人資料</Title>

      <Card style={{ background: '#1f2937', border: '1px solid #374151', marginBottom: 24 }}>
        <Descriptions column={2} labelStyle={{ color: '#9ca3af' }} contentStyle={{ color: '#f3f4f6' }}>
          <Descriptions.Item label="姓名">{member.姓名}</Descriptions.Item>
          <Descriptions.Item label="學號">{member.學號}</Descriptions.Item>
          <Descriptions.Item label="電子郵件">{member.電子郵件}</Descriptions.Item>
          <Descriptions.Item label="加入日期">{member.加入日期}</Descriptions.Item>
          <Descriptions.Item label="狀態">
            <Tag color={STATUS_COLORS[member.狀態]}>{member.狀態}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="身份">
            <Tag color={member.幹部權限 ? 'orange' : 'blue'}>
              {member.幹部權限 ? '幹部' : '一般社員'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title={<Text style={{ color: '#f3f4f6' }}>編輯資料</Text>}
        style={{ background: '#1f2937', border: '1px solid #374151' }}
      >
        <Form
          layout="vertical"
          initialValues={{
            手機號碼: member.手機號碼 ?? '',
            樂器: member.樂器 ?? undefined,
            科系: member.科系 ?? '',
          }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item label={<span style={{ color: '#d1d5db' }}>手機號碼</span>} name="手機號碼">
            <Input placeholder="09XXXXXXXX" />
          </Form.Item>

          <Form.Item label={<span style={{ color: '#d1d5db' }}>科系</span>} name="科系">
            <Input placeholder="科系" />
          </Form.Item>

          <Form.Item label={<span style={{ color: '#d1d5db' }}>擅長樂器</span>} name="樂器">
            <Select placeholder="選擇樂器" allowClear>
              {INSTRUMENTS.map(i => <Option key={i} value={i}>{i}</Option>)}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              儲存變更
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
