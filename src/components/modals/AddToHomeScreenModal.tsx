import BaseModal from '../common/BaseModal'
import { AiOutlineCaretRight, AiFillApple, AiFillAndroid } from 'react-icons/ai'

interface AddToHomeScreenModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddToHomeScreenModal({
  isOpen,
  onClose
}: AddToHomeScreenModalProps) {
  
  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      width="500px"
    >
      {/* カスタムタイトル */}
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
          <span 
            className="px-1 relative text-gray-800 inline-block"
            style={{ 
              background: 'linear-gradient(180deg, transparent 50%, #fde047 50%)',
              animation: 'slideInFromLeft 0.8s ease-out'
            }}
          >
            ホーム画面からすぐ開けます！
          </span>
        </h2>
        <p className="text-gray-600 text-base leading-relaxed">
          スマートフォンならアプリ感覚で利用できます！
        </p>
      </div>
      
      {/* アニメーション定義 */}
      <style jsx>{`
        @keyframes slideInFromLeft {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      
      <div className="mb-6">
        <div className="space-y-6">
          {/* Safari (iOS) の説明 */}
          <div>
            <div className="flex items-center mb-3">
              <AiOutlineCaretRight className="w-4 h-4 mr-1 text-gray-600" />
              <AiFillApple className="w-5 h-5 mr-2 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Safari (iOS)</h3>
            </div>
            <div className="ml-5 pr-4 space-y-2">
              <p className="text-gray-700 leading-relaxed">
                <strong>1.</strong> Safariでこのページを開く
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>2.</strong> 画面下部の「共有」ボタンをタップ
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>3.</strong> 「ホーム画面に追加」をタップ
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>4.</strong> アプリ名を確認して「追加」をタップ
              </p>
            </div>
          </div>
          
          {/* Android Chrome の説明 */}
          <div>
            <div className="flex items-center mb-3">
              <AiOutlineCaretRight className="w-4 h-4 mr-1 text-gray-600" />
              <AiFillAndroid className="w-5 h-5 mr-2 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Android Chrome</h3>
            </div>
            <div className="ml-5 pr-4 space-y-2">
              <p className="text-gray-700 leading-relaxed">
                <strong>1.</strong> Chromeでこのページを開く
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>2.</strong> 画面右上のメニュー（三点リーダー）をタップ
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>3.</strong> 「ホーム画面に追加」または「アプリをインストール」をタップ
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>4.</strong> アプリ名を確認して「追加」をタップ
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="bg-white border py-2 px-6 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          style={{ 
            borderColor: '#616161',
            color: '#616161'
          }}
        >
          Close
        </button>
      </div>
    </BaseModal>
  )
}
