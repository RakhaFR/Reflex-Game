/** @type {import('next').NextConfig} */
const nextConfig = {
  // Biar bisa pakai assets dari folder public tanpa prefix
  // File vanilla (index.html dll) di root tidak konflik karena Next.js
  // hanya serve dari /public dan /.next
  trailingSlash: false,
};

module.exports = nextConfig;
