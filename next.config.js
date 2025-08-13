/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    domains: ["thunder-chat.s3.ap-southeast-1.amazonaws.com"],
  },
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Bỏ qua lỗi TS khi build (chỉ nên dùng tạm thời)
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
