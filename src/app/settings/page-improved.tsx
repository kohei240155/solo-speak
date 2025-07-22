import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings - Solo Speak',
  description: 'ユーザー設定 - Solo Speak語学学習アプリの個人設定',
  keywords: ['設定', 'ユーザー設定', 'プロフィール', 'Solo Speak'],
}

// 静的な設定ページレイアウト（Server Component）
export default function SettingsLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ユーザー設定</h2>
          <p className="text-gray-600">
            学習言語やプロフィール情報を設定してください。
            設定を完了すると、より効果的な学習体験をお楽しみいただけます。
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-8">
          <p className="text-center text-gray-600">
            設定機能は準備中です。しばらくお待ちください。
          </p>
        </div>
      </main>
    </div>
  )
}
