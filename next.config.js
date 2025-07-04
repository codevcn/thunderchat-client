/** @type {import('next').NextConfig} */
const nextConfig = {
   typescript: {
      ignoreBuildErrors: false,
   },
   images: {
      domains: ["thunder-chat.s3.ap-southeast-1.amazonaws.com"],
   },
}

module.exports = nextConfig
