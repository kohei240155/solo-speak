interface QuizPhraseListProps {
  isLoadingPhrases: boolean
  phraseCount: number
  onStartClick: () => void
}

export default function QuizPhraseList({
  isLoadingPhrases,
  phraseCount,
  onStartClick
}: QuizPhraseListProps) {
  if (isLoadingPhrases) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading phrases...</p>
      </div>
    )
  }

  if (phraseCount === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">No phrases found for quiz.</p>
        <p className="text-sm text-gray-500">Add some phrases first to start practicing.</p>
      </div>
    )
  }

  if (phraseCount < 1) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">At least 1 phrase is required for quiz mode.</p>
        <p className="text-sm text-gray-500">Current phrases: {phraseCount}</p>
      </div>
    )
  }

  return (
    <div className="text-center py-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Quiz Mode</h3>
        <p className="text-gray-600 mb-4">
          Test your knowledge with multiple choice questions
        </p>
        <p className="text-sm text-gray-500">
          Available phrases: {phraseCount}
        </p>
      </div>
      
      <button
        onClick={onStartClick}
        className="px-8 py-3 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        style={{ backgroundColor: '#616161' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#525252'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#616161'
        }}
      >
        Start Quiz
      </button>
    </div>
  )
}
