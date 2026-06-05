'use client'

import dynamic from 'next/dynamic'
import type { 社員Row } from '@/lib/types/database'

const AppShell = dynamic(() => import('./AppShell'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen bg-gray-950" />
  ),
})

interface Props {
  member: Pick<社員Row, '社員編號' | '姓名' | '狀態' | '幹部權限'>
  children: React.ReactNode
}

export default function ClientShell({ member, children }: Props) {
  return <AppShell member={member}>{children}</AppShell>
}
