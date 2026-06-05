'use client'

import { useState } from 'react'
import { App, Table, Tag, Button, Input, Select, Space, Typography, Popconfirm } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { createClient } from '@/lib/supabase/client'
import { updateMemberStatus, updateMemberPosition } from '@/lib/db/members'
import type { MemberStatus, MemberPosition } from '@/lib/types/database'

const { Title } = Typography
const { Search } = Input

interface Member {
  社員編號: number
  姓名: string
  學號: string
  電子郵件: string
  手機號碼: string | null
  樂器: string | null
  科系: string | null
  加入日期: string
  狀態: MemberStatus
  幹部權限: boolean
  職位: MemberPosition | null
}

const STATUS_COLORS: Record<MemberStatus, string> = {
  '在籍': 'green',
  '離社': 'red',
  '待審核': 'orange',
}

export default function MemberList({ initialMembers }: { initialMembers: Member[] }) {
  const [members, setMembers] = useState(initialMembers)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'all'>('all')
  const supabase = createClient()
  const { message } = App.useApp()

  async function handleStatusChange(id: number, status: MemberStatus) {
    const { error } = await updateMemberStatus(supabase, id, status)
    if (error) { message.error('更新失敗'); return }
    setMembers(prev => prev.map(m => m.社員編號 === id ? { ...m, 狀態: status } : m))
    message.success('狀態已更新')
  }

  async function handlePositionChange(id: number, 職位: MemberPosition) {
    const { error } = await updateMemberPosition(supabase, id, 職位)
    if (error) { message.error('更新失敗'); return }
    const 幹部權限 = 職位 === '幹部' || 職位 === '教學'
    setMembers(prev => prev.map(m => m.社員編號 === id ? { ...m, 職位, 幹部權限 } : m))
    message.success('職位已更新')
  }

  const filtered = members.filter(m => {
    const matchSearch = m.姓名.includes(search) || m.學號.includes(search) || m.電子郵件.includes(search)
    const matchStatus = statusFilter === 'all' || m.狀態 === statusFilter
    return matchSearch && matchStatus
  })

  const columns: ColumnsType<Member> = [
    { title: '姓名', dataIndex: '姓名', key: '姓名', width: 100 },
    { title: '學號', dataIndex: '學號', key: '學號', width: 110 },
    { title: '科系', dataIndex: '科系', key: '科系', width: 120, render: v => v ?? '—' },
    { title: '樂器', dataIndex: '樂器', key: '樂器', width: 80, render: v => v ?? '—' },
    { title: '電子郵件', dataIndex: '電子郵件', key: '電子郵件', ellipsis: true },
    { title: '手機', dataIndex: '手機號碼', key: '手機號碼', width: 120, render: v => v ?? '—' },
    { title: '加入日期', dataIndex: '加入日期', key: '加入日期', width: 110 },
    {
      title: '狀態', dataIndex: '狀態', key: '狀態', width: 90,
      render: (status: MemberStatus) => <Tag color={STATUS_COLORS[status]}>{status}</Tag>,
    },
    {
      title: '職位', dataIndex: '職位', key: '職位', width: 120,
      render: (v: MemberPosition | null, record) => (
        <Select
          value={v ?? '一般社員'}
          size="small"
          style={{ width: 100 }}
          onChange={(pos: MemberPosition) => handlePositionChange(record.社員編號, pos)}
          options={[
            { value: '一般社員', label: '一般社員' },
            { value: '幹部', label: '幹部' },
            { value: '教學', label: '教學' },
          ]}
        />
      ),
    },
    {
      title: '操作', key: 'action', width: 160, fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {record.狀態 === '待審核' && (
            <Popconfirm title="確認核准此社員？" onConfirm={() => handleStatusChange(record.社員編號, '在籍')}>
              <Button type="primary" size="small">核准</Button>
            </Popconfirm>
          )}
          {record.狀態 === '在籍' && (
            <Popconfirm title="確認將此社員設為離社？" onConfirm={() => handleStatusChange(record.社員編號, '離社')}>
              <Button danger size="small">離社</Button>
            </Popconfirm>
          )}
          {record.狀態 === '離社' && (
            <Popconfirm title="確認恢復在籍？" onConfirm={() => handleStatusChange(record.社員編號, '在籍')}>
              <Button size="small">恢復</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Title level={3} style={{ color: '#f3f4f6', marginBottom: 16 }}>社員管理</Title>

      <div className="flex gap-3 mb-4 flex-wrap">
        <Search
          placeholder="搜尋姓名、學號、Email"
          allowClear
          style={{ width: 260 }}
          prefix={<SearchOutlined />}
          onChange={e => setSearch(e.target.value)}
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '全部狀態' },
            { value: '待審核', label: '待審核' },
            { value: '在籍', label: '在籍' },
            { value: '離社', label: '離社' },
          ]}
        />
        <Tag color="blue">{filtered.length} 筆</Tag>
      </div>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="社員編號"
        scroll={{ x: 1000 }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        style={{ background: 'transparent' }}
      />
    </div>
  )
}
