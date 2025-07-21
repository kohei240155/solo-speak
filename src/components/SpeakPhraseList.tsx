interface SpeakPhraseListProps {
  isLoadingPhrases: boolean
  phraseCount: number
  onStartClick: () => void
}

export default function SpeakPhraseList({ 
  isLoadingPhrases, 
  phraseCount, 
  onStartClick 
}: SpeakPhraseListProps) {
  if (isLoadingPhrases) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading phrases...</p>
      </div>
    )
  }

  if (phraseCount === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">練習できるフレーズがありません</p>
        <p className="text-gray-500 text-sm mt-2">まずはフレーズを追加してください</p>
      </div>
    )
  }

  return (
    <div className="text-center py-8">
      <p className="text-gray-600">Speak練習を開始する準備ができています</p>
      <button
        onClick={onStartClick}
        className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
      >
        設定を開く
      </button>
    </div>
  )
}
