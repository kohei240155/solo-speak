import Footer from '@/components/layout/Footer'

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">お問い合わせ</h1>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <p className="text-gray-600 mb-6">
              Solo Speakに関するご質問、ご要望、不具合報告等がございましたら、
              以下のフォームよりお気軽にお問い合わせください。
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">ご注意</h3>
              <p className="text-yellow-700">
                現在、お問い合わせフォームは開発中です。<br />
                緊急のお問い合わせがある場合は、GitHub Issuesまたは開発者にご連絡ください。
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">よくある質問</h2>
            
            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Q. 音声認識が正しく動作しません</h3>
                <p className="text-gray-600">
                  A. ブラウザのマイクアクセス許可をご確認ください。また、静かな環境でお試しいただき、
                  マイクが正常に動作していることをご確認ください。
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Q. 学習データが保存されません</h3>
                <p className="text-gray-600">
                  A. ログインしていることをご確認ください。ゲストユーザーの場合、
                  データは一時的にしか保存されません。
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Q. 対応ブラウザを教えてください</h3>
                <p className="text-gray-600">
                  A. Chrome、Firefox、Safari、Edgeの最新版でご利用いただけます。
                  Internet Explorerはサポートしておりません。
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Q. スマートフォンでも利用できますか？</h3>
                <p className="text-gray-600">
                  A. はい、iOSおよびAndroidのモバイルブラウザでご利用いただけます。
                  ただし、音声機能の一部に制限がある場合があります。
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">お問い合わせの前に</h2>
            <p className="text-gray-600 mb-4">
              お問い合わせの前に、以下をご確認ください：
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>ブラウザのバージョンが最新であることを確認</li>
              <li>JavaScript が有効になっていることを確認</li>
              <li>必要に応じてキャッシュをクリア</li>
              <li>別のブラウザで同様の問題が発生するかを確認</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">お問い合わせフォーム（開発中）</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <p className="text-gray-500 text-center">
                お問い合わせフォームは現在開発中です。<br />
                しばらくお待ちください。
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">回答について</h2>
            <p className="text-gray-600 mb-4">
              お問い合わせをいただいてから、通常2-3営業日以内にご回答いたします。
              内容によってはお時間をいただく場合がございますので、予めご了承ください。
            </p>
          </section>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
