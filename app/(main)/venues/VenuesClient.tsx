'use client'

import { useState, useEffect, useCallback } from 'react'
import { App, Tabs, Modal, Form, Input, Select, Typography, Button, Tag, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import { createClient } from '@/lib/supabase/client'
import { createReservation, updateReservationStatus, type 場地Row, type 場地預約Row } from '@/lib/db/facilities'
import WeeklyTimetable, { getMonday, type TimetableCell } from '@/components/WeeklyTimetable'

const { Title } = Typography

interface Props {
  venues: 場地Row[]
  member: { 社員編號: number; 幹部權限: boolean }
}

function buildCells(
  bookings: 場地預約Row[],
  venueId: number,
  memberId: number,
  weekStart: Dayjs,
): Record<string, TimetableCell> {
  const cells: Record<string, TimetableCell> = {}
  const relevant = bookings.filter(b => b.場地編號 === venueId && b.狀態 !== '已取消')
  for (let day = 0; day < 7; day++) {
    for (let hour = 9; hour < 22; hour++) {
      const slotStart = weekStart.add(day, 'day').hour(hour).minute(0).second(0).millisecond(0)
      const slotEnd = slotStart.add(1, 'hour')
      const hit = relevant.find(b => dayjs(b.開始時間).isBefore(slotEnd) && dayjs(b.結束時間).isAfter(slotStart))
      if (hit) {
        cells[`${day}-${hour}`] = {
          status: hit.社員編號 === memberId ? 'mine' : 'taken',
          label: hit.社員編號 === memberId ? '我的' : '已預約',
        }
      }
    }
  }
  return cells
}

export default function VenuesClient({ venues, member }: Props) {
  const [weekStart, setWeekStart] = useState(getMonday())
  const [bookings, setBookings] = useState<場地預約Row[]>([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<{ venueId: number; day: number; hour: number } | null>(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()
  const { message } = App.useApp()

  const loadBookings = useCallback(async () => {
    const from = weekStart.toISOString()
    const to = weekStart.add(7, 'day').toISOString()
    const { data } = await supabase
      .from('場地預約')
      .select('*')
      .gte('開始時間', from)
      .lte('開始時間', to)
      .neq('狀態', '已取消')
    setBookings(data ?? [])
  }, [weekStart])

  useEffect(() => { loadBookings() }, [loadBookings])

  function handleCellClick(venueId: number, day: number, hour: number) {
    setSelected({ venueId, day, hour })
    form.resetFields()
    setOpen(true)
  }

  async function handleSubmit(values: { 時數: number; 用途: string }) {
    if (!selected) return
    setSubmitting(true)
    const startTime = weekStart.add(selected.day, 'day').hour(selected.hour).minute(0).second(0)
    const endTime = startTime.add(values.時數, 'hour')

    // check all slots available
    const cells = buildCells(bookings, selected.venueId, member.社員編號, weekStart)
    for (let h = selected.hour; h < selected.hour + values.時數; h++) {
      const day = selected.day
      const cell = cells[`${day}-${h}`]
      if (cell && cell.status === 'taken') {
        message.error(`${h}:00–${h + 1}:00 已被預約，請縮短時數`)
        setSubmitting(false)
        return
      }
    }

    const { error } = await createReservation(supabase, {
      場地編號: selected.venueId,
      社員編號: member.社員編號,
      開始時間: startTime.toISOString(),
      結束時間: endTime.toISOString(),
      用途: values.用途 || null,
    })
    setSubmitting(false)
    if (error) { message.error('預約失敗'); return }
    message.success('預約申請已送出')
    setOpen(false)
    loadBookings()
  }

  const myBookings = bookings.filter(b => b.社員編號 === member.社員編號)
  const myColumns: ColumnsType<場地預約Row> = [
    { title: '場地', dataIndex: '場地編號', key: '場地', render: id => venues.find(v => v.場地編號 === id)?.場地名稱 ?? id },
    { title: '開始', dataIndex: '開始時間', key: '開始時間', render: v => dayjs(v).format('M/D HH:mm') },
    { title: '結束', dataIndex: '結束時間', key: '結束時間', render: v => dayjs(v).format('M/D HH:mm') },
    { title: '用途', dataIndex: '用途', key: '用途', render: v => v ?? '—' },
    { title: '狀態', dataIndex: '狀態', key: '狀態', render: v => <Tag color={v === '待確認' ? 'orange' : v === '已確認' ? 'green' : 'red'}>{v}</Tag> },
    {
      title: '操作', key: 'action', render: (_, r) => r.狀態 === '待確認' ? (
        <Button danger size="small" onClick={async () => {
          await updateReservationStatus(supabase, r.預約編號, '已取消')
          loadBookings()
        }}>取消</Button>
      ) : null,
    },
  ]

  const selectedVenueName = selected ? venues.find(v => v.場地編號 === selected.venueId)?.場地名稱 : ''
  const selectedDate = selected ? weekStart.add(selected.day, 'day').format('M/D (dd)') : ''

  return (
    <div>
      <Title level={3} style={{ color: '#f3f4f6', marginBottom: 16 }}>場地預約</Title>

      <Tabs
        defaultActiveKey={String(venues[0]?.場地編號)}
        items={venues.map(v => ({
          key: String(v.場地編號),
          label: v.場地名稱,
          children: (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag color={v.狀態 === '可使用' ? 'green' : 'orange'}>{v.狀態}</Tag>
                <span style={{ color: '#9ca3af', fontSize: 13 }}>{v.位置} · 容納 {v.容納人數} 人</span>
              </div>
              <WeeklyTimetable
                weekStart={weekStart}
                onWeekChange={setWeekStart}
                cells={buildCells(bookings, v.場地編號, member.社員編號, weekStart)}
                onCellClick={(day, hour) => v.狀態 === '可使用' && handleCellClick(v.場地編號, day, hour)}
              />
            </div>
          ),
        }))}
      />

      <div className="mt-8">
        <Title level={5} style={{ color: '#9ca3af', marginBottom: 8 }}>我的預約</Title>
        <Table dataSource={myBookings} columns={myColumns} rowKey="預約編號" pagination={{ pageSize: 10 }} scroll={{ x: 600 }} size="small" />
      </div>

      <Modal
        title={`申請預約 — ${selectedVenueName}`}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="送出"
        cancelText="取消"
      >
        <div style={{ color: '#9ca3af', marginBottom: 12 }}>
          {selectedDate} {selected?.hour}:00 開始
        </div>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ 時數: 1 }}>
          <Form.Item name="時數" label="使用時數" rules={[{ required: true }]}>
            <Select options={[1, 2, 3, 4].map(h => ({ value: h, label: `${h} 小時` }))} />
          </Form.Item>
          <Form.Item name="用途" label="用途說明">
            <Input.TextArea rows={2} placeholder="例：社團練習、幹部會議" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
