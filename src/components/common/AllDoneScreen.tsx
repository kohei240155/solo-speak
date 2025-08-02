import AnimatedButton from './AnimatedButton'

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
        <div className="flex-1">
          <AnimatedButton
            onClick={onFinish}
            variant="secondary"
          >
            Finish
          </AnimatedButton>
        </div>
        <div className="flex-1">
          <AnimatedButton
            onClick={onRetry}
            variant="primary"
          >
            Retry
          </AnimatedButton>
        </div>
      </div>
    </div>
  )
}
