import BaseModal from '../common/BaseModal'

interface PhraseGenerationTipsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PhraseGenerationTipsModal({
  isOpen,
  onClose
}: PhraseGenerationTipsModalProps) {
  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="フレーズ生成のコツ"
      width="700px"
    >
      {/* コンテンツ */}
      <div className="space-y-6">
        {/* メインの説明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            💡 より正確なフレーズを生成するために
          </h3>
          <p className="text-blue-800 text-sm leading-relaxed">
            曖昧で婉曲的な表現よりも、明確で直接的な表現を使うことで、
            より自然で正確な外国語フレーズが生成されます。
          </p>
        </div>

        {/* 例での比較 */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 text-lg">
            📝 具体例で比較
          </h3>
          
          {/* 悪い例 */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-600 font-semibold">❌ 改善が必要</span>
            </div>
            <p className="text-red-800 font-medium mb-2">
              「ご注文の料理はお揃いでしょうか？」
            </p>
            <ul className="text-red-700 text-sm space-y-1 ml-4">
              <li>• 婉曲的で曖昧な表現</li>
              <li>• 主語が不明確</li>
              <li>• 日本語特有の慣用表現</li>
            </ul>
          </div>

          {/* 良い例 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600 font-semibold">✅ おすすめ</span>
            </div>
            <p className="text-green-800 font-medium mb-2">
              「注文した料理は全て届いていますか？」
            </p>
            <ul className="text-green-700 text-sm space-y-1 ml-4">
              <li>• 明確で直接的な表現</li>
              <li>• 主語と動作が明示されている</li>
              <li>• 外国語に変換しやすい構造</li>
            </ul>
          </div>
        </div>

        {/* コツをまとめて表示 */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 text-lg">
            🎯 効果的なフレーズ作成のコツ
          </h3>
          
          <div className="grid gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                1. 主語を明確にする
              </h4>
              <p className="text-gray-600 text-sm">
                「料理は...」よりも「注文した料理は...」のように、
                誰が何をしたかを明示しましょう。
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                2. 具体的な動詞を使う
              </h4>
              <p className="text-gray-600 text-sm">
                「お揃い」よりも「届いている」「完成している」など、
                具体的な動作や状態を表す動詞を使いましょう。
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                3. 婉曲表現を避ける
              </h4>
              <p className="text-gray-600 text-sm">
                日本語特有の遠回しな表現ではなく、
                ストレートに意味が伝わる表現を心がけましょう。
              </p>
            </div>
          </div>
        </div>

        {/* その他の例 */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 text-lg">
            📚 その他の例
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-red-500 text-sm font-medium mt-1">❌</span>
              <div className="flex-1">
                <p className="text-gray-900 font-medium">「お料理はまだお済みでないですか？」</p>
                <p className="text-gray-600 text-sm">→ 二重否定で分かりにくい表現</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-green-500 text-sm font-medium mt-1">✅</span>
              <div className="flex-1">
                <p className="text-gray-900 font-medium">「まだお食事中でしょうか？」</p>
                <p className="text-gray-600 text-sm">→ シンプルで直接的な表現</p>
              </div>
            </div>
          </div>
        </div>

        {/* 理解しましたボタン */}
        <button
          onClick={onClose}
          className="w-full text-white py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
          style={{ backgroundColor: '#616161' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#525252'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#616161'
          }}
        >
          理解しました
        </button>
      </div>
    </BaseModal>
  )
}
