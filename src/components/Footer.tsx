import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start">
          {/* ロゴセクション */}
          <div className="mb-6 md:mb-0">
            <div className="flex items-center">
              <Image
                src="/images/logo/Solo Speak Icon.png"
                alt="Solo Speak"
                width={40}
                height={40}
                className="mr-3"
              />
              <span className="text-xl font-bold text-gray-800">Solo Speak</span>
            </div>
            <p className="text-gray-600 mt-2 text-sm max-w-xs">
              一人でも楽しく語学学習ができるアプリケーション
            </p>
          </div>

          {/* リンクセクション */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8">
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">サービス</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/about"
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    Solo Speakについて
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-span-2 md:col-span-1">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">法的事項</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/terms"
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    利用規約
                  </a>
                </li>
                <li>
                  <a
                    href="/privacy"
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    プライバシーポリシー
                  </a>
                </li>
                <li>
                  <a
                    href="/commercial-transaction"
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    特定商取引法表記
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-span-2 md:col-span-1">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">サポート</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/contact"
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    お問い合わせ
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* コピーライト */}
        <div className="border-t border-gray-200 mt-8 pt-6">
          <p className="text-sm text-gray-500 text-center">
            © {new Date().getFullYear()} Solo Speak. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
