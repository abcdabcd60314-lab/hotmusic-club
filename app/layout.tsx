import type { Metadata } from 'next'
import './globals.css'
import AntdProvider from '@/components/AntdProvider'

export const metadata: Metadata = {
  title: '熱音社管理系統',
  description: '熱音社社團管理系統',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className="h-full">
      <body className="h-full bg-gray-950 text-white antialiased">
        <AntdProvider>{children}</AntdProvider>
      </body>
    </html>
  )
}
