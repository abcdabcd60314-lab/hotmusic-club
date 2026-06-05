'use client'

import { Card, Col, Row, Statistic, Typography } from 'antd'
import { TeamOutlined, CalendarOutlined, ToolOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface Props {
  memberCount: number
  eventCount: number
  repairCount: number
}

export default function DashboardStats({ memberCount, eventCount, repairCount }: Props) {
  return (
    <div>
      <Title level={3} style={{ color: '#f3f4f6', marginBottom: 24 }}>系統首頁</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <Statistic
              title={<Text style={{ color: '#9ca3af' }}>在籍社員</Text>}
              value={memberCount}
              prefix={<TeamOutlined style={{ color: '#f97316' }} />}
              valueStyle={{ color: '#f3f4f6' }}
              suffix="人"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <Statistic
              title={<Text style={{ color: '#9ca3af' }}>近期活動</Text>}
              value={eventCount}
              prefix={<CalendarOutlined style={{ color: '#3b82f6' }} />}
              valueStyle={{ color: '#f3f4f6' }}
              suffix="項"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ background: '#1f2937', border: '1px solid #374151' }}>
            <Statistic
              title={<Text style={{ color: '#9ca3af' }}>待處理報修</Text>}
              value={repairCount}
              prefix={<ToolOutlined style={{ color: '#ef4444' }} />}
              valueStyle={{ color: '#f3f4f6' }}
              suffix="件"
            />
          </Card>
        </Col>
      </Row>

      <div className="mt-8">
        <Card
          title={<Text style={{ color: '#f3f4f6' }}>系統公告</Text>}
          style={{ background: '#1f2937', border: '1px solid #374151' }}
        >
          <Text style={{ color: '#9ca3af' }}>歡迎使用熱音社管理系統！如有問題請聯絡幹部。</Text>
        </Card>
      </div>
    </div>
  )
}
