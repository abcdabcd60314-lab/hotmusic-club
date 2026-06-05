'use client'

import { useState } from 'react'
import { App, Tabs, Table, Tag, Button, Modal, Form, Input, DatePicker, Typography, Card, Row, Col, Popconfirm, Badge } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { createClient } from '@/lib/supabase/client'
import { createReservation, updateReservationStatus, type 場地Row, type 場地預約Row } from '@/lib/db/facilities'
import type { 社員Row } from '@/lib/types/database'

const { Title } = Typography
type MemberShort = Pick<社員Row, '社員編號' | '姓名' | '狀態' | '幹部權限'>

interface Props {
  venues: 場地Row[]
  myReservations: 場地預約Row[]
  allReservations: 場地預約Row[]
  member: MemberShort
}

const VENUE_STATUS_COLOR: Record<string, string> = {
  '可使用': 'green', '使用中': 'blue', '維修中': 'orange',
}
const RES_STATUS_COLOR: Record<string, string> = {
  '待確認': 'orange', '已確認': 'green', '已取消': 'red',
}

export default function FacilitiesClient({ venues, myReservations: initMyRes, allReservations: initAllRes, member }: Props) {
  const [myRes, setMyRes] = useState(initMyRes)
  const [allRes, setAllRes] = useState(initAllRes)
  const [open, setOpen] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState<場地Row | null>(null)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const supabase = createClient()
  const { message } = App.useApp()

  function openReserve(venue: 場地Row) {
    setSelectedVenue(venue)
    setOpen(true)
  }

  async function handleReserve(values: Record<string, unknown>) {
    if (!selectedVenue) return
    setLoading(true)
    const range = values.時間範圍 as [ReturnType<typeof dayjs>, ReturnType<typeof dayjs>]
    const { error } = await createReservation(supabase, {
      場地編號: selectedVenue.場地編號,
      社員編號: member.社員編號,
      開始時間: range[0].toISOString(),
      結束時間: range[1].toISOString(),
      用途: (values.用途 as string) || null,
    })
    setLoading(false)
    if (error) { message.error('預約失敗'); return }
    message.success('預約申請已送出，等候幹部確認')
    setOpen(false)
    form.resetFields()
    window.location.reload()
  }

  async function handleUpdateStatus(預約編號: number, 狀態: string) {
    setLoading(true)
    const { error } = await updateReservationStatus(supabase, 預約編號, 狀態)
    setLoading(false)
    if (error) { message.error('更新失敗'); return }
    setAllRes(prev => prev.map(r => r.預約編號 === 預約編號 ? { ...r, 狀態 } : r))
    setMyRes(prev => prev.map(r => r.預約編號 === 預約編號 ? { ...r, 狀態 } : r))
    message.success('狀態已更新')
  }

  const myResColumns: ColumnsType<場地預約Row> = [
    { title: '場地', key: '場地', render: (_, r) => r.場地?.場地名稱 ?? `場地 #${r.場地編號}` },
    { title: '開始時間', dataIndex: '開始時間', key: '開始時間', width: 155, render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '結束時間', dataIndex: '結束時間', key: '結束時間', width: 155, render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '用途', dataIndex: '用途', key: '用途', render: v => v ?? '—' },
    { title: '狀態', dataIndex: '狀態', key: '狀態', width: 90, render: v => <Tag color={RES_STATUS_COLOR[v] ?? 'default'}>{v}</Tag> },
    {
      title: '操作', key: 'action', width: 90,
      render: (_, r) => r.狀態 === '待確認' && (
        <Popconfirm title="確認取消預約？" onConfirm={() => handleUpdateStatus(r.預約編號, '已取消')}>
          <Button danger size="small">取消</Button>
        </Popconfirm>
      ),
    },
  ]

  const allResColumns: ColumnsType<場地預約Row> = [
    { title: '場地', key: '場地', render: (_, r) => r.場地?.場地名稱 ?? `場地 #${r.場地編號}` },
    { title: '社員編號', dataIndex: '社員編號', key: '社員編號', width: 90 },
    { title: '開始時間', dataIndex: '開始時間', key: '開始時間', width: 155, render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '結束時間', dataIndex: '結束時間', key: '結束時間', width: 155, render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '用途', dataIndex: '用途', key: '用途', render: v => v ?? '—' },
    { title: '狀態', dataIndex: '狀態', key: '狀態', width: 90, render: v => <Tag color={RES_STATUS_COLOR[v] ?? 'default'}>{v}</Tag> },
    {
      title: '操作', key: 'action', width: 160,
      render: (_, r) => r.狀態 === '待確認' && (
        <div className="flex gap-1">
          <Button type="primary" size="small" onClick={() => handleUpdateStatus(r.預約編號, '已確認')}>確認</Button>
          <Button danger size="small" onClick={() => handleUpdateStatus(r.預約編號, '已取消')}>拒絕</Button>
        </div>
      ),
    },
  ]

  const pendingCount = allRes.filter(r => r.狀態 === '待確認').length

  const tabItems = [
    {
      key: 'venues',
      label: '場地列表',
      children: (
        <Row gutter={[16, 16]}>
          {venues.length === 0 && <Col span={24}><Typography.Text style={{ color: '#9ca3af' }}>尚無場地資料</Typography.Text></Col>}
          {venues.map(v => (
            <Col xs={24} sm={12} md={8} key={v.場地編號}>
              <Card
                style={{ background: '#1f2937', border: '1px solid #374151' }}
                actions={[
                  <Button key="res" type="primary" size="small" disabled={v.狀態 !== '可使用'} onClick={() => openReserve(v)}>
                    申請預約
                  </Button>
                ]}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Typography.Title level={5} style={{ color: '#f3f4f6', margin: 0 }}>{v.場地名稱}</Typography.Title>
                    <Typography.Text style={{ color: '#9ca3af', fontSize: 13 }}>{v.位置 ?? '位置未定'}</Typography.Text>
                    {v.容納人數 && <div style={{ color: '#9ca3af', fontSize: 13 }}>容納 {v.容納人數} 人</div>}
                  </div>
                  <Tag color={VENUE_STATUS_COLOR[v.狀態] ?? 'default'}>{v.狀態}</Tag>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ),
    },
    {
      key: 'my',
      label: '我的預約',
      children: <Table dataSource={myRes} columns={myResColumns} rowKey="預約編號" scroll={{ x: 700 }} pagination={{ pageSize: 20 }} />,
    },
    ...(member.幹部權限 ? [{
      key: 'all',
      label: <Badge count={pendingCount} offset={[8, 0]}>所有預約</Badge>,
      children: <Table dataSource={allRes} columns={allResColumns} rowKey="預約編號" scroll={{ x: 800 }} pagination={{ pageSize: 20 }} />,
    }] : []),
  ]

  return (
    <div>
      <Title level={3} style={{ color: '#f3f4f6', marginBottom: 16 }}>場地與設備管理</Title>
      <Tabs defaultActiveKey="venues" items={tabItems} />

      <Modal
        title={`申請預約 — ${selectedVenue?.場地名稱}`}
        open={open}
        onCancel={() => { setOpen(false); form.resetFields() }}
        onOk={() => form.submit()}
        confirmLoading={loading}
        okText="送出申請"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleReserve}>
          <Form.Item name="時間範圍" label="預約時間" rules={[{ required: true, message: '請選擇時間範圍' }]}>
            <DatePicker.RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="用途" label="用途說明">
            <Input.TextArea rows={2} placeholder="例：社團練習、幹部會議" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
