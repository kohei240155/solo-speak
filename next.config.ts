import type { NextConfig } from "next";

// Supabase URLから動的にホスト名を取得
const getSupabaseHostname = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const url = new URL(supabaseUrl);
      return url.hostname;
    } catch (error) {
      console.warn('Failed to parse NEXT_PUBLIC_SUPABASE_URL:', error);
    }
  }
  // フォールバック
  return 'rxxhmujumdlltouyukbs.supabase.co';
};

const supabaseHostname = getSupabaseHostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/a/**',
      },
      {
        protocol: 'https',
        hostname: supabaseHostname,
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // 追加のSupabaseホスト名（異なる環境用）
      {
        protocol: 'https',
        hostname: 'rxxhmujumdlltouyukbs.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    domains: ['localhost'],
    // 画像キャッシュ設定を追加
    minimumCacheTTL: 60, // 1分間のキャッシュ
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
