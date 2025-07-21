interface QuizCompleteProps {
  onFinish: () => void
  onRetry: () => void
}

export default function QuizComplete({ onFinish, onRetry }: QuizCompleteProps) {
  return (
    <div className="flex flex-col min-h-[400px] p-6">
      <div className="text-center mt-8">
        <h1 className="text-3xl font-bold text-gray-900">All Done!</h1>
      </div>

      <div className="flex-1"></div>

      <div className="flex space-x-4 w-full max-w-md mx-auto mb-4">
        <button
          onClick={onFinish}
          className="flex-1 bg-white border border-gray-300 py-3 px-4 rounded-md font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
        >
          Finish
        </button>
        
        <button
          onClick={onRetry}
          className="flex-1 text-white py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
          style={{ backgroundColor: '#616161' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#525252'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#616161'
          }}
        >
          Retry
        </button>
      </div>
    </div>
  )
}
