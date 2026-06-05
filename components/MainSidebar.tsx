'use client'

import { useState } from 'react'
import { Layout, Menu, Avatar, Button, Tag, Typography } from 'antd'
import {
  TeamOutlined,
  CalendarOutlined,
  ToolOutlined,
  DollarOutlined,
  DashboardOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const { Sider } = Layout
const { Text } = Typography

interface Props {
  member: { 社員編號: number; 姓名: string; 狀態: string; 幹部權限: boolean }
}

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '首頁' },
  { key: '/members', icon: <TeamOutlined />, label: '社員管理' },
  { key: '/events', icon: <CalendarOutlined />, label: '活動管理' },
  { key: '/facilities', icon: <ToolOutlined />, label: '場地與設備' },
  { key: '/finance', icon: <DollarOutlined />, label: '財務管理' },
  { key: '/profile', icon: <UserOutlined />, label: '個人資料' },
]

export default function MainSidebar({ member }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const selectedKey = menuItems.find(item => pathname.startsWith(item.key))?.key ?? '/dashboard'

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={220}
      style={{ background: '#111827', borderRight: '1px solid #1f2937' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
        {!collapsed && (
          <Text strong style={{ color: '#f97316', fontSize: 16 }}>🎸 熱音社</Text>
        )}
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          style={{ color: '#9ca3af' }}
        />
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Avatar size="small" icon={<UserOutlined />} style={{ background: '#f97316' }} />
            <div className="flex flex-col">
              <Text style={{ color: '#f3f4f6', fontSize: 13, lineHeight: 1.2 }}>{member.姓名}</Text>
              <Tag
                color={member.幹部權限 ? 'orange' : 'blue'}
                style={{ fontSize: 10, marginTop: 2, width: 'fit-content' }}
              >
                {member.幹部權限 ? '幹部' : '社員'}
              </Tag>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        style={{ background: '#111827', borderRight: 'none', marginTop: 8 }}
        items={menuItems
          .filter(item => {
            // 財務管理 only for 幹部
            if (item.key === '/finance' && !member.幹部權限) return false
            return true
          })
          .map(item => ({
            key: item.key,
            icon: item.icon,
            label: <Link href={item.key}>{item.label}</Link>,
          }))}
      />

      {/* Logout */}
      <div className="absolute bottom-4 left-0 right-0 px-3">
        <Button
          danger
          block
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          style={{ background: 'transparent' }}
        >
          {!collapsed && '登出'}
        </Button>
      </div>
    </Sider>
  )
}
