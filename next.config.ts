import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['antd', '@ant-design/icons', '@ant-design/cssinjs', 'rc-util', 'rc-picker'],
}

export default nextConfig
