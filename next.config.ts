import type { NextConfig } from 'next'

// Forward-slash absolute path bypasses react-server export condition in Turbopack SSR bundle
const reactPath = require.resolve('react').replace(/\\/g, '/')

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      'react': reactPath,
    },
  },
}

export default nextConfig
