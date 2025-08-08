import Footer from '@/components/layout/Footer'

export default function CommercialTransactionPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">特定商取引法に基づく表記</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-sm text-gray-500 mb-8">最終更新日：2025年7月22日</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">販売業者</h2>
            <p className="text-gray-600">Solo Speak運営事務局</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">運営責任者</h2>
            <p className="text-gray-600">[運営責任者名]</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">所在地</h2>
            <p className="text-gray-600">
              [住所]<br />
              ※お問い合わせは、<a href="https://forms.gle/M9qBSGfiJCVWqmjE8" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">お問い合わせフォーム</a>にて承っております。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">連絡先</h2>
            <p className="text-gray-600">
              メール：<a href="https://forms.gle/M9qBSGfiJCVWqmjE8" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">お問い合わせフォーム</a>よりご連絡ください<br />
              ※お電話でのお問い合わせは承っておりません。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">サービス内容</h2>
            <p className="text-gray-600">
              語学学習支援Webアプリケーション「Solo Speak」の提供
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">料金</h2>
            <p className="text-gray-600">
              基本機能：無料<br />
              プレミアム機能：[料金が設定されている場合の詳細]<br />
              ※現在、本サービスは無料でご利用いただけます。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">支払方法</h2>
            <p className="text-gray-600">
              ※現在、有料サービスは提供しておりません。<br />
              今後有料サービスを提供する場合は、以下の支払方法を予定しております：
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
              <li>クレジットカード決済</li>
              <li>その他の電子決済サービス</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">支払時期</h2>
            <p className="text-gray-600">
              ※現在、有料サービスは提供しておりません。<br />
              今後有料サービスを提供する場合は、サービス申込み時に即時決済となります。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">サービス提供時期</h2>
            <p className="text-gray-600">
              お申し込み完了後、即座にサービスをご利用いただけます。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">返品・キャンセルについて</h2>
            <p className="text-gray-600">
              デジタルコンテンツの性質上、サービス開始後の返品・返金は承っておりません。<br />
              ※現在、無料サービスのため該当しません。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">動作環境</h2>
            <p className="text-gray-600 mb-4">
              以下の環境でご利用いただけます：
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Windows 10以降のパソコン（Chrome、Firefox、Edge、Safari対応）</li>
              <li>macOS（Chrome、Firefox、Safari対応）</li>
              <li>iOS（Safari対応）</li>
              <li>Android（Chrome対応）</li>
              <li>インターネット接続環境必須</li>
              <li>マイク機能（音声機能を使用する場合）</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">その他</h2>
            <p className="text-gray-600">
              サービスの詳細については、利用規約およびプライバシーポリシーをご確認ください。
            </p>
          </section>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
