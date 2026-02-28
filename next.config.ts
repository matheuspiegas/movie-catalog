import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    // ⚠️ Desabilita verificação de TypeScript durante o build
    ignoreBuildErrors: true,
  },
  eslint: {
    // ⚠️ Desabilita verificação de ESLint durante o build
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
