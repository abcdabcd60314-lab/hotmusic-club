'use client'

import { useState } from 'react'
import { App, Table, Tag, Button, Modal, Form, Input, Space, Typography, Badge, Popconfirm } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { createClient } from '@/lib/supabase/client'
import { createRepair, updateRepairStatus, type 報修申請Row, type RepairStatus } from '@/lib/db/repairs'

const { Title } = Typography

const STATUS_COLOR: Record<RepairStatus, string> = {
  '待處理': 'orange',
  '處理中': 'blue',
  '已完成': 'green',
}

interface Props {
  myRepairs: 報修申請Row[]
  allRepairs: 報修申請Row[]
  member: { 社員編號: number; 幹部權限: boolean }
}

export default function RepairsClient({ myRepairs: initMy, allRepairs: initAll, member }: Props) {
  const [myRepairs, setMyRepairs] = useState(initMy)
  const [allRepairs, setAllRepairs] = useState(initAll)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()
  const supabase = createClient()
  const { message } = App.useApp()

  async function handleSubmit(values: { 設備名稱: string; 問題描述: string }) {
    setSubmitting(true)
    const { error } = await createRepair(supabase, {
      社員編號: member.社員編號,
      設備名稱: values.設備名稱,
      問題描述: values.問題描述,
    })
    setSubmitting(false)
    if (error) { message.error('送出失敗'); return }
    message.success('報修申請已送出')
    setOpen(false)
    form.resetFields()
    window.location.reload()
  }

  async function handleStatusChange(id: number, 狀態: RepairStatus) {
    const { error } = await updateRepairStatus(supabase, id, 狀態)
    if (error) { message.error('更新失敗'); return }
    setAllRepairs(prev => prev.map(r => r.報修編號 === id ? { ...r, 狀態 } : r))
    message.success('狀態已更新')
  }

  const myColumns: ColumnsType<報修申請Row> = [
    { title: '設備名稱', dataIndex: '設備名稱', key: '設備名稱', width: 140 },
    { title: '問題描述', dataIndex: '問題描述', key: '問題描述', ellipsis: true },
    {
      title: '狀態', dataIndex: '狀態', key: '狀態', width: 90,
      render: (v: RepairStatus) => <Tag color={STATUS_COLOR[v]}>{v}</Tag>,
    },
    {
      title: '申請時間', dataIndex: '建立時間', key: '建立時間', width: 155,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
  ]

  const allColumns: ColumnsType<報修申請Row> = [
    { title: '設備名稱', dataIndex: '設備名稱', key: '設備名稱', width: 140 },
    { title: '問題描述', dataIndex: '問題描述', key: '問題描述', ellipsis: true },
    {
      title: '申請人', key: '申請人', width: 90,
      render: (_, r) => r.社員?.姓名 ?? `#${r.社員編號}`,
    },
    {
      title: '狀態', dataIndex: '狀態', key: '狀態', width: 90,
      render: (v: RepairStatus) => <Tag color={STATUS_COLOR[v]}>{v}</Tag>,
    },
    {
      title: '申請時間', dataIndex: '建立時間', key: '建立時間', width: 155,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作', key: 'action', width: 200,
      render: (_, r) => (
        <Space size="small">
          {r.狀態 === '待處理' && (
            <Button size="small" type="primary" onClick={() => handleStatusChange(r.報修編號, '處理中')}>
              開始處理
            </Button>
          )}
          {r.狀態 === '處理中' && (
            <Popconfirm title="確認標記為已完成？" onConfirm={() => handleStatusChange(r.報修編號, '已完成')}>
              <Button size="small" style={{ borderColor: '#16a34a', color: '#16a34a' }}>已完成</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  const pendingCount = allRepairs.filter(r => r.狀態 === '待處理').length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Title level={3} style={{ color: '#f3f4f6', margin: 0 }}>報修申請</Title>
        <Button type="primary" onClick={() => setOpen(true)}>新增報修</Button>
      </div>

      {member.幹部權限 && (
        <>
          <Title level={5} style={{ color: '#9ca3af', marginBottom: 8 }}>
            <Badge count={pendingCount} offset={[8, 0]}>所有報修申請</Badge>
          </Title>
          <Table
            dataSource={allRepairs}
            columns={allColumns}
            rowKey="報修編號"
            scroll={{ x: 800 }}
            pagination={{ pageSize: 20 }}
            style={{ marginBottom: 32 }}
          />
          <Title level={5} style={{ color: '#9ca3af', marginBottom: 8 }}>我的報修申請</Title>
        </>
      )}

      <Table
        dataSource={myRepairs}
        columns={myColumns}
        rowKey="報修編號"
        scroll={{ x: 600 }}
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title="新增報修申請"
        open={open}
        onCancel={() => { setOpen(false); form.resetFields() }}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="送出"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="設備名稱" label="設備名稱" rules={[{ required: true, message: '請輸入設備名稱' }]}>
            <Input placeholder="例：吉他音箱、麥克風、鼓架" />
          </Form.Item>
          <Form.Item name="問題描述" label="問題描述" rules={[{ required: true, message: '請描述問題' }]}>
            <Input.TextArea rows={3} placeholder="請詳細描述問題狀況" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
