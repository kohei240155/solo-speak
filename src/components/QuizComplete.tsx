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

      <div>
        <div className="flex justify-center items-start mb-8">
          {/* Finish ボタン */}
          <div className="flex flex-col items-center mr-4" style={{ width: '47%' }}>
            <button
              onClick={onFinish}
              className="w-full bg-white border py-2 px-6 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
              style={{ 
                borderColor: '#616161',
                color: '#616161'
              }}
            >
              Finish
            </button>
          </div>

          {/* Retry ボタン */}
          <div className="flex flex-col items-center" style={{ width: '47%' }}>
            <button
              onClick={onRetry}
              className="w-full text-white py-2 px-6 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
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
      </div>
    </div>
  )
}
