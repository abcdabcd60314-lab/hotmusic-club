'use client'

import { useState } from 'react'
import { App, Tabs, Table, Button, Modal, Form, Input, InputNumber, DatePicker, Select, Tag, Typography, Row, Col, Card, Statistic } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { createClient } from '@/lib/supabase/client'
import { addIncomeRecord, addExpenseRecord, type 收入紀錄Row, type 支出紀錄Row } from '@/lib/db/finance'

const { Title } = Typography

const INCOME_CATS = ['社費', '贊助', '票務', '補助', '其他']
const EXPENSE_CATS = ['器材', '場地', '活動費用', '行政', '餐飲', '其他']

interface Props {
  initialIncome: 收入紀錄Row[]
  initialExpense: 支出紀錄Row[]
  isOfficer: boolean
}

function RecordModal({ title, open, onClose, categories, onFinish, loading }: {
  title: string; open: boolean; onClose: () => void
  categories: string[]; onFinish: (v: Record<string, unknown>) => void; loading: boolean
}) {
  const [form] = Form.useForm()
  return (
    <Modal title={title} open={open} onCancel={() => { onClose(); form.resetFields() }}
      onOk={() => form.submit()} confirmLoading={loading} okText="新增" cancelText="取消">
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ 日期: dayjs() }}>
        <Form.Item name="日期" label="日期" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="類別" label="類別" rules={[{ required: true }]}>
          <Select options={categories.map(c => ({ value: c, label: c }))} />
        </Form.Item>
        <Form.Item name="金額" label="金額（NT$）" rules={[{ required: true }]}>
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="說明" label="說明">
          <Input.TextArea rows={2} placeholder="選填" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default function FinanceClient({ initialIncome, initialExpense, isOfficer }: Props) {
  const [income, setIncome] = useState(initialIncome)
  const [expense, setExpense] = useState(initialExpense)
  const [incomeOpen, setIncomeOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { message } = App.useApp()

  const totalIncome = income.reduce((s, r) => s + Number(r.金額), 0)
  const totalExpense = expense.reduce((s, r) => s + Number(r.金額), 0)
  const balance = totalIncome - totalExpense

  async function handleAddIncome(values: Record<string, unknown>) {
    setLoading(true)
    const { error } = await addIncomeRecord(supabase, {
      金額: values.金額 as number,
      類別: values.類別 as string,
      說明: (values.說明 as string) || null,
      日期: (values.日期 as ReturnType<typeof dayjs>).format('YYYY-MM-DD'),
    })
    setLoading(false)
    if (error) { message.error('新增失敗'); return }
    message.success('已新增收入紀錄')
    setIncomeOpen(false)
    window.location.reload()
  }

  async function handleAddExpense(values: Record<string, unknown>) {
    setLoading(true)
    const { error } = await addExpenseRecord(supabase, {
      金額: values.金額 as number,
      類別: values.類別 as string,
      說明: (values.說明 as string) || null,
      日期: (values.日期 as ReturnType<typeof dayjs>).format('YYYY-MM-DD'),
    })
    setLoading(false)
    if (error) { message.error('新增失敗'); return }
    message.success('已新增支出紀錄')
    setExpenseOpen(false)
    window.location.reload()
  }

  const incomeColumns: ColumnsType<收入紀錄Row> = [
    { title: '日期', dataIndex: '日期', key: '日期', width: 110 },
    { title: '類別', dataIndex: '類別', key: '類別', width: 90, render: v => <Tag color="green">{v}</Tag> },
    { title: '金額', dataIndex: '金額', key: '金額', width: 120, render: v => `NT$ ${Number(v).toLocaleString()}` },
    { title: '說明', dataIndex: '說明', key: '說明', render: v => v ?? '—' },
  ]

  const expenseColumns: ColumnsType<支出紀錄Row> = [
    { title: '日期', dataIndex: '日期', key: '日期', width: 110 },
    { title: '類別', dataIndex: '類別', key: '類別', width: 90, render: v => <Tag color="red">{v}</Tag> },
    { title: '金額', dataIndex: '金額', key: '金額', width: 120, render: v => `NT$ ${Number(v).toLocaleString()}` },
    { title: '說明', dataIndex: '說明', key: '說明', render: v => v ?? '—' },
  ]

  return (
    <div>
      <Title level={3} style={{ color: '#f3f4f6', marginBottom: 16 }}>收支查詢</Title>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <Statistic title={<span style={{ color: '#9ca3af' }}>總收入</span>}
              value={totalIncome} prefix="NT$" valueStyle={{ color: '#22c55e' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <Statistic title={<span style={{ color: '#9ca3af' }}>總支出</span>}
              value={totalExpense} prefix="NT$" valueStyle={{ color: '#ef4444' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <Statistic title={<span style={{ color: '#9ca3af' }}>結餘</span>}
              value={balance} prefix="NT$"
              valueStyle={{ color: balance >= 0 ? '#22c55e' : '#ef4444' }} />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="income" items={[
        {
          key: 'income', label: '收入紀錄',
          children: (
            <div>
              {isOfficer && (
                <div className="flex justify-end mb-3">
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setIncomeOpen(true)}>新增收入</Button>
                </div>
              )}
              <Table dataSource={income} columns={incomeColumns} rowKey="記錄編號"
                pagination={{ pageSize: 20 }} scroll={{ x: 600 }} />
            </div>
          ),
        },
        {
          key: 'expense', label: '支出紀錄',
          children: (
            <div>
              {isOfficer && (
                <div className="flex justify-end mb-3">
                  <Button danger icon={<PlusOutlined />} onClick={() => setExpenseOpen(true)}>新增支出</Button>
                </div>
              )}
              <Table dataSource={expense} columns={expenseColumns} rowKey="記錄編號"
                pagination={{ pageSize: 20 }} scroll={{ x: 600 }} />
            </div>
          ),
        },
      ]} />

      <RecordModal title="新增收入" open={incomeOpen} onClose={() => setIncomeOpen(false)}
        categories={INCOME_CATS} onFinish={handleAddIncome} loading={loading} />
      <RecordModal title="新增支出" open={expenseOpen} onClose={() => setExpenseOpen(false)}
        categories={EXPENSE_CATS} onFinish={handleAddExpense} loading={loading} />
    </div>
  )
}
