import Footer from "@/components/layout/Footer";

export default function CommercialTransactionPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          特定商取引法に基づく表記
        </h1>

        <div className="prose prose-lg max-w-none">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  現在準備中です
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    現在、Solo
                    Speakは無料でご利用いただけるサービスとして提供されており、
                    有料のサブスクリプション機能は実装されておりません。
                  </p>
                  <p className="mt-2">
                    将来的に有料サービスを開始する際には、こちらに特定商取引法に基づく表記を掲載いたします。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              現在のサービス内容
            </h2>
            <p className="text-gray-600">
              Solo Speakは現在、以下のサービスを無料で提供しております：
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
              <li>多言語フレーズ学習機能</li>
              <li>クイズ機能</li>
              <li>学習進捗管理</li>
              <li>ランキング機能</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              お問い合わせ
            </h2>
            <p className="text-gray-600">
              サービスに関するご質問やお問い合わせは、
              <a
                href="https://forms.gle/M9qBSGfiJCVWqmjE8"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                お問い合わせフォーム
              </a>
              よりご連絡ください。
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
