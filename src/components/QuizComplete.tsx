interface QuizCompleteProps {
  onFinish: () => void
  onRetry: () => void
}

export default function QuizComplete({ onFinish, onRetry }: QuizCompleteProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">All Done!</h1>
      </div>

      <div className="flex flex-col space-y-4 w-full max-w-sm">
        <button
          onClick={onFinish}
          className="w-full bg-white border border-gray-300 py-3 px-6 rounded-md font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          Finish
        </button>
        
        <button
          onClick={onRetry}
          className="w-full bg-gray-600 text-white py-3 px-6 rounded-md font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  )
}
