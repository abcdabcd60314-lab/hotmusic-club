'use client'

import { useState, useEffect, useCallback } from 'react'
import { App, Tabs, Modal, Form, InputNumber, Typography, Button, Tag, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import { createClient } from '@/lib/supabase/client'
import {
  createEquipmentBooking, cancelEquipmentBooking,
  type 設備Row, type 設備預約Row,
} from '@/lib/db/equipment'
import WeeklyTimetable, { getMonday, type TimetableCell } from '@/components/WeeklyTimetable'

const { Title } = Typography

interface Props {
  equipment: 設備Row[]
  member: { 社員編號: number; 幹部權限: boolean }
}

function buildCells(
  bookings: 設備預約Row[],
  equip: 設備Row,
  memberId: number,
  weekStart: Dayjs,
): Record<string, TimetableCell> {
  const cells: Record<string, TimetableCell> = {}
  const relevant = bookings.filter(b => b.設備編號 === equip.設備編號)
  for (let day = 0; day < 7; day++) {
    for (let hour = 9; hour < 22; hour++) {
      const slotStart = weekStart.add(day, 'day').hour(hour).minute(0).second(0).millisecond(0)
      const slotEnd = slotStart.add(1, 'hour')
      const overlapping = relevant.filter(b =>
        dayjs(b.開始時間).isBefore(slotEnd) && dayjs(b.結束時間).isAfter(slotStart)
      )
      const booked = overlapping.reduce((s, b) => s + b.數量, 0)
      const avail = equip.數量 - booked
      const isMine = overlapping.some(b => b.社員編號 === memberId)
      if (avail <= 0) {
        cells[`${day}-${hour}`] = { status: 'taken', label: '已滿' }
      } else if (isMine) {
        cells[`${day}-${hour}`] = { status: 'mine', label: `${avail}/${equip.數量}` }
      } else if (booked > 0) {
        cells[`${day}-${hour}`] = { status: 'partial', label: `${avail}/${equip.數量}` }
      }
    }
  }
  return cells
}

export default function EquipmentClient({ equipment, member }: Props) {
  const [weekStart, setWeekStart] = useState(getMonday())
  const [bookings, setBookings] = useState<設備預約Row[]>([])
  const [myBookings, setMyBookings] = useState<(設備預約Row & { 設備: { 設備名稱: string } | null })[]>([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<{ equip: 設備Row; day: number; hour: number } | null>(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()
  const { message } = App.useApp()

  const loadBookings = useCallback(async () => {
    const from = weekStart.toISOString()
    const to = weekStart.add(7, 'day').toISOString()
    const { data } = await supabase
      .from('設備預約')
      .select('*')
      .gte('開始時間', from)
      .lte('開始時間', to)
      .neq('狀態', '已取消')
    setBookings(data ?? [])
    const { data: mine } = await supabase
      .from('設備預約')
      .select('*, 設備(設備名稱)')
      .eq('社員編號', member.社員編號)
      .neq('狀態', '已取消')
      .order('開始時間', { ascending: false })
    setMyBookings(mine ?? [])
  }, [weekStart])

  useEffect(() => { loadBookings() }, [loadBookings])

  function handleCellClick(equip: 設備Row, day: number, hour: number) {
    setSelected({ equip, day, hour })
    form.resetFields()
    setOpen(true)
  }

  async function handleSubmit(values: { 數量: number; 時數: number }) {
    if (!selected) return
    const cells = buildCells(bookings, selected.equip, member.社員編號, weekStart)
    const maxAvail = selected.equip.數量 - (bookings
      .filter(b => b.設備編號 === selected.equip.設備編號)
      .filter(b => {
        const slotStart = weekStart.add(selected.day, 'day').hour(selected.hour).minute(0).second(0)
        return dayjs(b.開始時間).isBefore(slotStart.add(1, 'hour')) && dayjs(b.結束時間).isAfter(slotStart)
      })
      .reduce((s, b) => s + b.數量, 0))

    if (values.數量 > maxAvail) {
      message.error(`最多只能借 ${maxAvail} 個`); return
    }

    // check subsequent hours
    for (let h = selected.hour; h < selected.hour + values.時數; h++) {
      const cell = cells[`${selected.day}-${h}`]
      if (cell?.status === 'taken') {
        message.error(`${h}:00 時段已滿，請縮短時數`); return
      }
    }

    setSubmitting(true)
    const startTime = weekStart.add(selected.day, 'day').hour(selected.hour).minute(0).second(0)
    const { error } = await createEquipmentBooking(supabase, {
      設備編號: selected.equip.設備編號,
      社員編號: member.社員編號,
      開始時間: startTime.toISOString(),
      結束時間: startTime.add(values.時數, 'hour').toISOString(),
      數量: values.數量,
    })
    setSubmitting(false)
    if (error) { message.error('借用申請失敗'); return }
    message.success('借用申請已送出')
    setOpen(false)
    loadBookings()
  }

  const myColumns: ColumnsType<設備預約Row & { 設備: { 設備名稱: string } | null }> = [
    { title: '設備', key: '設備', render: (_, r) => r.設備?.設備名稱 ?? `#${r.設備編號}` },
    { title: '數量', dataIndex: '數量', key: '數量', width: 60 },
    { title: '開始', dataIndex: '開始時間', key: '開始', render: v => dayjs(v).format('M/D HH:mm') },
    { title: '結束', dataIndex: '結束時間', key: '結束', render: v => dayjs(v).format('M/D HH:mm') },
    { title: '狀態', dataIndex: '狀態', key: '狀態', render: v => <Tag color={v === '待確認' ? 'orange' : v === '已確認' ? 'green' : 'red'}>{v}</Tag> },
    {
      title: '操作', key: 'action', render: (_, r) => r.狀態 === '待確認' ? (
        <Button danger size="small" onClick={async () => {
          await cancelEquipmentBooking(supabase, r.預約編號)
          loadBookings()
        }}>取消</Button>
      ) : null,
    },
  ]

  const selectedDate = selected ? weekStart.add(selected.day, 'day').format('M/D') : ''

  return (
    <div>
      <Title level={3} style={{ color: '#f3f4f6', marginBottom: 16 }}>設備借用</Title>

      <Tabs
        defaultActiveKey={String(equipment[0]?.設備編號)}
        items={equipment.map(eq => ({
          key: String(eq.設備編號),
          label: `${eq.設備名稱}${eq.數量 > 1 ? ` ×${eq.數量}` : ''}`,
          children: (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Tag color={eq.狀態 === '可使用' ? 'green' : 'orange'}>{eq.狀態}</Tag>
                <span style={{ color: '#9ca3af', fontSize: 13 }}>共 {eq.數量} 個</span>
              </div>
              <WeeklyTimetable
                weekStart={weekStart}
                onWeekChange={setWeekStart}
                cells={buildCells(bookings, eq, member.社員編號, weekStart)}
                onCellClick={(day, hour) => eq.狀態 === '可使用' && handleCellClick(eq, day, hour)}
              />
            </div>
          ),
        }))}
      />

      <div className="mt-8">
        <Title level={5} style={{ color: '#9ca3af', marginBottom: 8 }}>我的借用紀錄</Title>
        <Table dataSource={myBookings} columns={myColumns} rowKey="預約編號" pagination={{ pageSize: 10 }} scroll={{ x: 560 }} size="small" />
      </div>

      <Modal
        title={`借用 ${selected?.equip.設備名稱}`}
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
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ 數量: 1, 時數: 1 }}>
          <Form.Item name="數量" label="數量" rules={[{ required: true }]}>
            <InputNumber min={1} max={selected?.equip.數量} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="時數" label="使用時數" rules={[{ required: true }]}>
            <InputNumber min={1} max={4} style={{ width: '100%' }} addonAfter="小時" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
