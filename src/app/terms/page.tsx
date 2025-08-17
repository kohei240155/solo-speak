import Footer from '@/components/layout/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">利用規約</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-sm text-gray-500 mb-8">最終更新日：2025年8月17日</p>

          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-gray-300 pb-2">第1章 総則</h2>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">第1条（目的）</h3>
            <p className="text-gray-600 mb-4">
              本利用規約（以下「本規約」といいます。）は、個人が提供するアプリケーション「Solo Speak」（以下「本サービス」といいます。）の利用条件を定めるものです。ユーザーは、本サービスを利用することにより、本規約に同意したものとみなされます。
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">第2条（適用範囲）</h3>
            <p className="text-gray-600 mb-4">
              本規約は、本サービスの利用に関するすべての関係に適用されます。
            </p>
            <p className="text-gray-600 mb-4">
              また、本サービス内で随時掲載される注意事項やガイドライン等は、本規約の一部を構成するものとします。
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">第3条（定義）</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>「ユーザー」：本規約に同意の上、本サービスを利用するすべての個人</li>
              <li>「コンテンツ」：本サービス上に登録・保存・表示される情報（文章・画像・音声など）</li>
            </ul>
          </section>

          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-gray-300 pb-2">第2章 アカウント</h2>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">第4条（利用登録）</h3>
            <p className="text-gray-600 mb-4">
              本サービスの利用を希望する者は、本規約に同意の上、提供者の定める方法により利用登録を行います。
            </p>
            <p className="text-gray-600 mb-4">次のいずれかに該当する場合、利用をお断りすることがあります。</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>申請内容に虚偽がある場合</li>
              <li>過去に利用停止処分を受けたことがある場合</li>
              <li>その他、本サービスの運営に支障があると判断した場合</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">第5条（アカウント管理）</h3>
            <p className="text-gray-600 mb-4">
              ユーザーは、自己の責任でアカウント情報を管理するものとし、第三者に譲渡・貸与してはなりません。
            </p>
            <p className="text-gray-600 mb-4">
              不正使用により損害が生じても、提供者に故意または重過失がない限り責任を負いません。
            </p>
          </section>

          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-gray-300 pb-2">第3章 サービス利用</h2>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">第6条（禁止事項）</h3>
            <p className="text-gray-600 mb-4">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>本サービスや第三者の知的財産権を侵害する行為</li>
              <li>サーバーやネットワークに過度な負荷を与える行為</li>
              <li>不正アクセス、リバースエンジニアリング等の行為</li>
              <li>他のユーザーや第三者に不利益・損害・不快感を与える行為</li>
              <li>本サービスの情報を営利目的で利用する行為</li>
              <li>その他、提供者が不適切と判断する行為</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">第7条（サービスの停止等）</h3>
            <p className="text-gray-600 mb-4">提供者は、次の場合に事前通知なくサービスの全部または一部を停止することがあります。</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>システムの保守・更新を行う場合</li>
              <li>停電や災害等の不可抗力により提供が困難な場合</li>
              <li>システム障害や不正アクセスが発生した場合</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">第8条（利用制限・登録抹消）</h3>
            <p className="text-gray-600 mb-4">
              ユーザーが本規約に違反した場合、事前通知なく利用制限や登録抹消を行うことがあります。
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">第9条（免責事項）</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>提供者は、本サービスに不具合やエラーがないことを保証しません。</li>
              <li>本サービスの利用により発生した損害について、提供者に故意または重過失がない限り責任を負いません。</li>
              <li>ユーザー間または第三者との間で発生したトラブルは、当事者間で解決するものとします。</li>
            </ul>
          </section>

          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-gray-300 pb-2">第4章 雑則</h2>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">第10条（規約の変更）</h3>
            <p className="text-gray-600 mb-4">
              提供者は、必要に応じて本規約を変更することがあります。変更後の内容は本サービスに掲載した時点で効力を持ちます。
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">第11条（通知・連絡）</h3>
            <p className="text-gray-600 mb-4">
              ユーザーへの通知は、本サービス内での掲示やメール等により行います。
            </p>
            <p className="text-gray-600 mb-4">
              ユーザーからの問い合わせは、指定の連絡方法によって行うものとします。
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">第12条（権利義務の譲渡禁止）</h3>
            <p className="text-gray-600 mb-4">
              ユーザーは、提供者の承諾なく本規約に基づく権利義務を第三者に譲渡できません。
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">第13条（準拠法・裁判管轄）</h3>
            <p className="text-gray-600 mb-4">
              本規約は日本法を準拠法とし、本サービスに関して紛争が生じた場合は、提供者の所在地を管轄する裁判所を専属的な第一審の裁判所とします。
            </p>
          </section>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
