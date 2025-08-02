interface AllDoneScreenProps {
  onFinish: () => void
  onRetry: () => void
}

export default function AllDoneScreen({ onFinish, onRetry }: AllDoneScreenProps) {
  return (
    <div className="flex flex-col min-h-[300px]">
      <div className="text-center mt-10">
        <h1 className="text-3xl font-bold text-gray-900">All Done!</h1>
      </div>

      <div className="flex-1"></div>

      {/* ボタン */}
      <div className="flex gap-3">
        <button
          onClick={onFinish}
          className="flex-1 bg-white border py-2 px-4 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          style={{ 
            borderColor: '#616161',
            color: '#616161'
          }}
        >
          Finish
        </button>
        <button
          onClick={onRetry}
          className="flex-1 text-white py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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
