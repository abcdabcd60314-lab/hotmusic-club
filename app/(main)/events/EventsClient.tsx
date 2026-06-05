'use client'

import { useState } from 'react'
import { App, Table, Tag, Button, Modal, Form, Input, Select, DatePicker, InputNumber, Typography, Popconfirm } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { createClient } from '@/lib/supabase/client'
import { createEvent, registerEvent, cancelRegistration } from '@/lib/db/events'
import type { 活動Row, 活動報名Row, 社員Row } from '@/lib/types/database'

const { Title } = Typography
type MemberShort = Pick<社員Row, '社員編號' | '姓名' | '狀態' | '幹部權限'>

interface Props {
  events: 活動Row[]
  myRegistrations: 活動報名Row[]
  member: MemberShort
}

const TYPE_COLOR = { '表演': 'purple', '活動': 'blue' }

export default function EventsClient({ events: init, myRegistrations: initRegs, member }: Props) {
  const [events, setEvents] = useState(init)
  const [regs, setRegs] = useState(initRegs)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()
  const supabase = createClient()
  const { message } = App.useApp()

  const regMap = new Map(regs.map(r => [r.活動編號, r]))

  async function handleRegister(event: 活動Row) {
    setSubmitting(true)
    const { error } = await registerEvent(supabase, event.活動編號, member.社員編號)
    setSubmitting(false)
    if (error) { message.error('報名失敗'); return }
    setRegs(prev => [...prev, { 報名編號: Date.now(), 活動編號: event.活動編號, 社員編號: member.社員編號, 報名時間: new Date().toISOString(), 狀態: '已確認' }])
    message.success('報名成功！')
  }

  async function handleCancel(event: 活動Row) {
    const reg = regMap.get(event.活動編號)
    if (!reg) return
    setSubmitting(true)
    const { error } = await cancelRegistration(supabase, reg.報名編號)
    setSubmitting(false)
    if (error) { message.error('取消失敗'); return }
    setRegs(prev => prev.filter(r => r.報名編號 !== reg.報名編號))
    message.success('已取消報名')
  }

  async function handleCreate(values: Record<string, unknown>) {
    setSubmitting(true)
    const { error } = await createEvent(supabase, {
      活動名稱: values.活動名稱 as string,
      活動類型: values.活動類型 as '表演' | '活動',
      說明: (values.說明 as string) || null,
      活動時間: (values.活動時間 as ReturnType<typeof dayjs>).toISOString(),
      地點: (values.地點 as string) || null,
      報名截止: values.報名截止 ? (values.報名截止 as ReturnType<typeof dayjs>).toISOString() : null,
      人數上限: (values.人數上限 as number) || null,
    })
    setSubmitting(false)
    if (error) { message.error('建立失敗'); return }
    message.success('活動已建立')
    setOpen(false)
    form.resetFields()
    window.location.reload()
  }

  const columns: ColumnsType<活動Row> = [
    { title: '活動名稱', dataIndex: '活動名稱', key: '活動名稱' },
    {
      title: '類型', dataIndex: '活動類型', key: '活動類型', width: 80,
      render: (t) => <Tag color={TYPE_COLOR[t as keyof typeof TYPE_COLOR]}>{t}</Tag>,
    },
    {
      title: '時間', dataIndex: '活動時間', key: '活動時間', width: 150,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    { title: '地點', dataIndex: '地點', key: '地點', width: 120, render: v => v ?? '—' },
    { title: '人數上限', dataIndex: '人數上限', key: '人數上限', width: 90, render: v => v ?? '無限制' },
    {
      title: '報名', key: 'status', width: 90,
      render: (_, r) => regMap.has(r.活動編號)
        ? <Tag color="green">已報名</Tag>
        : <Tag>未報名</Tag>,
    },
    {
      title: '操作', key: 'action', width: 110,
      render: (_, r) => regMap.has(r.活動編號) ? (
        <Popconfirm title="確認取消報名？" onConfirm={() => handleCancel(r)}>
          <Button danger size="small" loading={submitting}>取消報名</Button>
        </Popconfirm>
      ) : (
        <Button type="primary" size="small" loading={submitting} onClick={() => handleRegister(r)}>報名</Button>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Title level={3} style={{ color: '#f3f4f6', margin: 0 }}>活動管理</Title>
        {member.幹部權限 && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>新增活動</Button>
        )}
      </div>

      <Table dataSource={events} columns={columns} rowKey="活動編號" scroll={{ x: 800 }} pagination={{ pageSize: 20 }} />

      <Modal title="新增活動" open={open} onCancel={() => { setOpen(false); form.resetFields() }}
        onOk={() => form.submit()} confirmLoading={submitting} okText="建立" cancelText="取消">
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="活動名稱" label="活動名稱" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="活動類型" label="活動類型" rules={[{ required: true }]} initialValue="活動">
            <Select options={[{ value: '表演', label: '🎸 表演' }, { value: '活動', label: '🎉 活動' }]} />
          </Form.Item>
          <Form.Item name="活動時間" label="活動時間" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="地點" label="地點">
            <Input placeholder="例：學生活動中心" />
          </Form.Item>
          <Form.Item name="報名截止" label="報名截止">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="人數上限" label="人數上限（不填表示無限制）">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="說明" label="說明">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
