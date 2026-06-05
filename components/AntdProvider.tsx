'use client'

import { App, ConfigProvider, theme } from 'antd'
import zhTW from 'antd/locale/zh_TW'
import { AntdRegistry } from '@ant-design/nextjs-registry'

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
    <ConfigProvider
      locale={zhTW}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#f97316',
          borderRadius: 6,
          colorBgContainer: '#1f2937',
          colorBgElevated: '#374151',
          colorBorder: '#374151',
          colorText: '#f3f4f6',
          colorTextSecondary: '#9ca3af',
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
    </AntdRegistry>
  )
}
