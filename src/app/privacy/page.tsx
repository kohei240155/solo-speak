export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">プライバシーポリシー</h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-sm text-gray-500 mb-8">最終更新日：2025年7月22日</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. 個人情報の収集について</h2>
          <p className="text-gray-600 mb-4">
            当サービス「Solo Speak」（以下「本サービス」）では、サービスの提供にあたり、以下の個人情報を収集いたします。
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>メールアドレス</li>
            <li>ユーザー名</li>
            <li>学習履歴・進捗データ</li>
            <li>登録したフレーズ・翻訳データ</li>
            <li>音声データ（発音練習時）</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. 個人情報の利用目的</h2>
          <p className="text-gray-600 mb-4">収集した個人情報は、以下の目的で利用いたします。</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>本サービスの提供・運営</li>
            <li>ユーザーの認証・識別</li>
            <li>学習進捗の記録・管理</li>
            <li>サービス改善のための分析</li>
            <li>お問い合わせへの対応</li>
            <li>重要なお知らせの配信</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. 個人情報の第三者提供</h2>
          <p className="text-gray-600 mb-4">
            当社は、法令に基づく場合を除き、ご本人の同意なく個人情報を第三者に提供することはありません。
            ただし、以下の場合は除きます。
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>法令に基づく場合</li>
            <li>人の生命、身体または財産の保護のために必要がある場合</li>
            <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
            <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. 個人情報の管理</h2>
          <p className="text-gray-600 mb-4">
            当社は、個人情報の正確性を保ち、これを安全に管理いたします。
            個人情報への不正アクセス・紛失・破壊・改ざん・漏洩などを防止するため、必要かつ適切な安全管理措置を実施いたします。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. 音声データについて</h2>
          <p className="text-gray-600 mb-4">
            発音練習機能で収集された音声データは、音声認識処理にのみ使用され、処理完了後は即座に削除されます。
            音声データが当社のサーバーに長期間保存されることはありません。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Cookieの使用について</h2>
          <p className="text-gray-600 mb-4">
            本サービスでは、ユーザーエクスペリエンスの向上を目的として、Cookieを使用する場合があります。
            Cookieを無効にした場合、本サービスの一部機能が正常に動作しない可能性があります。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. 個人情報の開示・訂正・削除</h2>
          <p className="text-gray-600 mb-4">
            ご本人から個人情報の開示・訂正・削除等のご請求があった場合、ご本人であることを確認の上、合理的な期間内に対応いたします。
            お問い合わせフォームよりご連絡ください。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. プライバシーポリシーの変更</h2>
          <p className="text-gray-600 mb-4">
            当社は、必要に応じて本プライバシーポリシーを変更する場合があります。
            変更した場合は、本ページに掲載し、重要な変更については適切な方法でお知らせいたします。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. お問い合わせ</h2>
          <p className="text-gray-600 mb-4">
            個人情報の取扱いに関するお問い合わせは、お問い合わせフォームよりご連絡ください。
          </p>
        </section>
      </div>
    </div>
  )
}
