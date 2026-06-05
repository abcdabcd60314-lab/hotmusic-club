'use client'

import { Layout } from 'antd'
import MainSidebar from './MainSidebar'
import type { 社員Row } from '@/lib/types/database'

const { Content } = Layout

interface Props {
  member: Pick<社員Row, '社員編號' | '姓名' | '狀態' | '幹部權限'>
  children: React.ReactNode
}

export default function AppShell({ member, children }: Props) {
  return (
    <Layout style={{ minHeight: '100vh', background: '#030712' }}>
      <MainSidebar member={member} />
      <Layout style={{ background: '#030712' }}>
        <Content style={{ padding: 24, overflow: 'auto' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
