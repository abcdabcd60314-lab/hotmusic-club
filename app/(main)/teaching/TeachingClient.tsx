'use client'

import { useState, useEffect, useCallback } from 'react'
import { App, Tabs, Modal, Form, TimePicker, Typography, Button, Tag, Table, Popconfirm, DatePicker } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import { createClient } from '@/lib/supabase/client'
import {
  getTeachingSlots, addTeachingSlot, deleteTeachingSlot,
  createTeachingBooking, getMyTeachingBookings, getTeacherBookings,
  type 教學時段Row, type 教學預約Row,
} from '@/lib/db/teaching'
import WeeklyTimetable, { getMonday, type TimetableCell } from '@/components/WeeklyTimetable'

const { Title, Text } = Typography

type Teacher = { 社員編號: number; 姓名: string; 樂器: string | null }

interface Props {
  member: { 社員編號: number; 姓名: string; 幹部權限: boolean; 職位: string | null }
  teachers: Teacher[]
}

function buildCells(
  slots: 教學時段Row[],
  bookings: 教學預約Row[],
  teacherId: number,
  memberId: number,
  weekStart: Dayjs,
): Record<string, TimetableCell> {
  const cells: Record<string, TimetableCell> = {}
  const mySlots = slots.filter(s => s.教師社員編號 === teacherId)
  for (let day = 0; day < 7; day++) {
    for (let hour = 9; hour < 22; hour++) {
      const slotStart = weekStart.add(day, 'day').hour(hour).minute(0).second(0).millisecond(0)
      const slotEnd = slotStart.add(1, 'hour')
      const slot = mySlots.find(s =>
        dayjs(s.開始時間).isBefore(slotEnd) && dayjs(s.結束時間).isAfter(slotStart)
      )
      if (!slot) {
        cells[`${day}-${hour}`] = { status: 'taken', label: '' }
        continue
      }
      const booking = bookings.find(b =>
        b.時段編號 === slot.時段編號 && b.狀態 !== '已取消'
      )
      if (booking) {
        cells[`${day}-${hour}`] = {
          status: booking.學員社員編號 === memberId ? 'mine' : 'taken',
          label: booking.學員社員編號 === memberId ? '我的預約' : '已預約',
        }
      } else if (slot.教師社員編號 === memberId) {
        cells[`${day}-${hour}`] = { status: 'mine', label: '我的時段' }
      } else {
        cells[`${day}-${hour}`] = { status: 'partial', label: '可預約' }
      }
    }
  }
  return cells
}

export default function TeachingClient({ member, teachers }: Props) {
  const isTeacher = member.職位 === '教學'
  const [weekStart, setWeekStart] = useState(getMonday())
  const [slots, setSlots] = useState<教學時段Row[]>([])
  const [bookings, setBookings] = useState<教學預約Row[]>([])
  const [myBookings, setMyBookings] = useState<教學預約Row[]>([])
  const [teacherBookings, setTeacherBookings] = useState<教學預約Row[]>([])
  const [bookOpen, setBookOpen] = useState(false)
  const [addSlotOpen, setAddSlotOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ teacherId: number; slotId: number } | null>(null)
  const [slotForm] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()
  const { message } = App.useApp()

  const load = useCallback(async () => {
    const from = weekStart.toISOString()
    const to = weekStart.add(7, 'day').toISOString()
    const { data: slotsData } = await getTeachingSlots(supabase, from, to)
    setSlots(slotsData ?? [])
    const slotIds = (slotsData ?? []).map(s => s.時段編號)
    if (slotIds.length > 0) {
      const { data: bkData } = await supabase
        .from('教學預約').select('*').in('時段編號', slotIds).neq('狀態', '已取消')
      setBookings(bkData ?? [])
    } else {
      setBookings([])
    }
    const { data: myBk } = await getMyTeachingBookings(supabase, member.社員編號)
    setMyBookings(myBk ?? [])
    if (isTeacher) {
      const { data: tBk } = await getTeacherBookings(supabase, member.社員編號)
      setTeacherBookings(tBk ?? [])
    }
  }, [weekStart, isTeacher])

  useEffect(() => { load() }, [load])

  function handleCellClick(teacherId: number, day: number, hour: number) {
    const slotStart = weekStart.add(day, 'day').hour(hour).minute(0).second(0).millisecond(0)
    const slotEnd = slotStart.add(1, 'hour')
    const slot = slots.find(s =>
      s.教師社員編號 === teacherId &&
      dayjs(s.開始時間).isBefore(slotEnd) &&
      dayjs(s.結束時間).isAfter(slotStart)
    )
    if (!slot) return
    setSelectedSlot({ teacherId, slotId: slot.時段編號 })
    setBookOpen(true)
  }

  async function handleBook() {
    if (!selectedSlot) return
    setSubmitting(true)
    const { error } = await createTeachingBooking(supabase, {
      時段編號: selectedSlot.slotId,
      學員社員編號: member.社員編號,
    })
    setSubmitting(false)
    if (error) { message.error('預約失敗'); return }
    message.success('預約申請已送出')
    setBookOpen(false)
    load()
  }

  async function handleAddSlot(values: { 日期: Dayjs; 開始: Dayjs; 結束: Dayjs }) {
    const date = values.日期
    const start = date.hour(values.開始.hour()).minute(0).second(0)
    const end = date.hour(values.結束.hour()).minute(0).second(0)
    if (end.isBefore(start) || end.isSame(start)) {
      message.error('結束時間必須在開始時間之後'); return
    }
    setSubmitting(true)
    const { error } = await addTeachingSlot(supabase, {
      教師社員編號: member.社員編號,
      開始時間: start.toISOString(),
      結束時間: end.toISOString(),
    })
    setSubmitting(false)
    if (error) { message.error(`新增失敗：${(error as any)?.message ?? JSON.stringify(error)}`); return }
    message.success('時段已新增')
    slotForm.resetFields()
    setAddSlotOpen(false)
    load()
  }

  const myBookingCols: ColumnsType<教學預約Row> = [
    { title: '教師', key: '教師', render: (_, r) => r.教學時段?.社員?.姓名 ?? '—' },
    { title: '開始', key: '開始', render: (_, r) => r.教學時段 ? dayjs(r.教學時段.開始時間).format('M/D HH:mm') : '—' },
    { title: '結束', key: '結束', render: (_, r) => r.教學時段 ? dayjs(r.教學時段.結束時間).format('M/D HH:mm') : '—' },
    { title: '狀態', dataIndex: '狀態', key: '狀態', render: v => <Tag color={v === '待確認' ? 'orange' : v === '已確認' ? 'green' : 'red'}>{v}</Tag> },
    {
      title: '操作', key: 'action', render: (_, r) => r.狀態 === '待確認' ? (
        <Button danger size="small" onClick={async () => {
          await supabase.from('教學預約').update({ 狀態: '已取消' }).eq('預約編號', r.預約編號)
          load()
        }}>取消</Button>
      ) : null,
    },
  ]

  const teacherBkCols: ColumnsType<教學預約Row> = [
    { title: '學員', key: '學員', render: (_, r) => r.社員?.姓名 ?? '—' },
    { title: '開始', key: '開始', render: (_, r) => r.教學時段 ? dayjs(r.教學時段.開始時間).format('M/D HH:mm') : '—' },
    { title: '結束', key: '結束', render: (_, r) => r.教學時段 ? dayjs(r.教學時段.結束時間).format('M/D HH:mm') : '—' },
    { title: '狀態', dataIndex: '狀態', key: '狀態', render: v => <Tag color={v === '待確認' ? 'orange' : v === '已確認' ? 'green' : 'red'}>{v}</Tag> },
    {
      title: '操作', key: 'action', render: (_, r) => r.狀態 === '待確認' ? (
        <Button type="primary" size="small" onClick={async () => {
          await supabase.from('教學預約').update({ 狀態: '已確認' }).eq('預約編號', r.預約編號)
          load()
        }}>確認</Button>
      ) : null,
    },
  ]

  const selectedTeacher = teachers.find(t => t.社員編號 === selectedSlot?.teacherId)

  if (teachers.length === 0) {
    return (
      <div>
        <Title level={3} style={{ color: '#f3f4f6', marginBottom: 16 }}>教學預約</Title>
        <Text style={{ color: '#9ca3af' }}>目前沒有教學老師，請等待幹部新增。</Text>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Title level={3} style={{ color: '#f3f4f6', margin: 0 }}>教學預約</Title>
        {isTeacher && (
          <Button type="primary" onClick={() => { slotForm.resetFields(); setAddSlotOpen(true) }}>
            新增可用時段
          </Button>
        )}
      </div>

      <Tabs
        defaultActiveKey={String(teachers[0]?.社員編號)}
        items={teachers.map(t => ({
          key: String(t.社員編號),
          label: `${t.姓名}${t.樂器 ? ` (${t.樂器})` : ''}`,
          children: (
            <WeeklyTimetable
              weekStart={weekStart}
              onWeekChange={setWeekStart}
              cells={buildCells(slots, bookings, t.社員編號, member.社員編號, weekStart)}
              onCellClick={(day, hour) => {
                const cell = buildCells(slots, bookings, t.社員編號, member.社員編號, weekStart)[`${day}-${hour}`]
                if (cell?.status === 'partial') handleCellClick(t.社員編號, day, hour)
              }}
            />
          ),
        }))}
      />

      <div className="mt-8">
        <Title level={5} style={{ color: '#9ca3af', marginBottom: 8 }}>我的預約紀錄</Title>
        <Table dataSource={myBookings} columns={myBookingCols} rowKey="預約編號" pagination={{ pageSize: 10 }} scroll={{ x: 500 }} size="small" />
      </div>

      {isTeacher && (
        <div className="mt-8">
          <Title level={5} style={{ color: '#9ca3af', marginBottom: 8 }}>學員預約我的時段</Title>
          <Table dataSource={teacherBookings} columns={teacherBkCols} rowKey="預約編號" pagination={{ pageSize: 10 }} scroll={{ x: 500 }} size="small" />
        </div>
      )}

      <Modal
        title={`預約教學 — ${selectedTeacher?.姓名}`}
        open={bookOpen}
        onCancel={() => setBookOpen(false)}
        onOk={handleBook}
        confirmLoading={submitting}
        okText="確認預約"
        cancelText="取消"
      >
        <p style={{ color: '#9ca3af' }}>送出後等待老師確認。</p>
      </Modal>

      <Modal
        title="新增教學時段"
        open={addSlotOpen}
        onCancel={() => setAddSlotOpen(false)}
        onOk={() => slotForm.submit()}
        confirmLoading={submitting}
        okText="新增"
        cancelText="取消"
      >
        <Form form={slotForm} layout="vertical" onFinish={handleAddSlot}>
          <Form.Item name="日期" label="日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="開始" label="開始時間" rules={[{ required: true }]}>
            <TimePicker format="HH:00" minuteStep={60} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="結束" label="結束時間" rules={[{ required: true }]}>
            <TimePicker format="HH:00" minuteStep={60} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
