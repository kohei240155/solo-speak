// next.config.ts の改良版（オプション）
import type { NextConfig } from "next";

// Supabase URLから hostname を抽出
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : '';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/a/**',
      },
      // Supabase Storage の設定
      ...(supabaseHostname ? [{
        protocol: 'https' as const,
        hostname: supabaseHostname,
        port: '',
        pathname: '/storage/v1/object/public/**',
      }] : []),
    ],
    domains: ['localhost'],
  },
};

export default nextConfig;
