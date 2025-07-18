export default function SubscriptionTab() {
  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div>
        <h2 className="text-gray-900 mb-4 text-lg md:text-xl font-bold">
          Current Status
        </h2>
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value="No Subscribe"
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>
          <button
            type="button"
            className="px-6 py-2 text-white rounded-md transition-colors duration-200"
            style={{ backgroundColor: '#616161' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#525252'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#616161'
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-gray-900 mb-4 text-lg md:text-xl font-bold">
          Plans
        </h2>
        <div className="border border-gray-300 rounded-lg p-6">
          <h3 className="text-gray-900 mb-2 text-xl md:text-2xl font-bold">
            Basic
          </h3>
          <div className="mb-4">
            <p className="text-gray-700 text-sm md:text-base font-bold">
              JP ¥ 500 / Month
            </p>
            <hr className="mt-2 border-gray-300" />
          </div>
          
          <div className="space-y-2" style={{ marginBottom: '180px' }}>
            <div className="flex items-center space-x-2">
              <span className="text-gray-700">•</span>
              <span className="text-gray-700 text-xs md:text-sm">
                1日5回までAIがフレーズを生成
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-700">•</span>
              <span className="text-gray-700 text-xs md:text-sm">
                音読回数をカウントする機能の提供
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-700">•</span>
              <span className="text-gray-700 text-xs md:text-sm">
                フレーズの暗記を助けるクイズ機能の提供
              </span>
            </div>
          </div>

          <button
            type="button"
            className="w-full text-white py-2 px-4 rounded-md transition-colors duration-200"
            style={{ backgroundColor: '#616161' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#525252'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#616161'
            }}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  )
}
