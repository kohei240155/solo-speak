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
  // パフォーマンス向上のための実験的機能
  experimental: {
    // 部分的プリレンダリング（PPR）を有効化
    ppr: true,
    // React Compilerを有効化（React 19で利用可能）
    reactCompiler: true,
  },

  // 静的エクスポート設定
  trailingSlash: false,
  
  // キャッシュ設定の最適化
  poweredByHeader: false,
  
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
  
  // Webpack設定の最適化
  webpack: (config, { isServer }) => {
    // バンドルアナライザーの設定（開発時のみ）
    if (process.env.ANALYZE === 'true') {
      const BundleAnalyzerPlugin = require('@next/bundle-analyzer')({
        enabled: true,
      });
      config.plugins.push(BundleAnalyzerPlugin);
    }

    // Tree shaking の改善
    if (!isServer) {
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    return config;
  },

  // ヘッダー設定でキャッシュを最適化
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // リダイレクト設定
  async redirects() {
    return [
      // 旧URLから新URLへのリダイレクト設定があれば追加
    ];
  },
};

export default nextConfig;
