import { useState } from "react";
import AnimatedButton from "./AnimatedButton";

interface AllDoneScreenProps {
	onFinish: () => void;
	onRetry: () => void;
}

export default function AllDoneScreen({
	onFinish,
	onRetry,
}: AllDoneScreenProps) {
	const [isFinishing, setIsFinishing] = useState(false);
	const [isRetrying, setIsRetrying] = useState(false);
	const [selectedAction, setSelectedAction] = useState<
		"finish" | "retry" | null
	>(null);

	const handleFinish = async () => {
		setSelectedAction("finish");
		setIsFinishing(true);

		// 少しの遅延を追加してスピナー表示を確認できるようにする
		await new Promise((resolve) => setTimeout(resolve, 300));

		onFinish();
		setIsFinishing(false);
		setSelectedAction(null);
	};

	const handleRetry = async () => {
		setSelectedAction("retry");
		setIsRetrying(true);

		// 少しの遅延を追加してスピナー表示を確認できるようにする
		await new Promise((resolve) => setTimeout(resolve, 300));

		onRetry();
		setIsRetrying(false);
		setSelectedAction(null);
	};
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
						onClick={handleFinish}
						disabled={isFinishing || isRetrying}
						variant="secondary"
						isLoading={isFinishing && selectedAction === "finish"}
					>
						Finish
					</AnimatedButton>
				</div>
				<div className="flex-1">
					<AnimatedButton
						onClick={handleRetry}
						disabled={isFinishing || isRetrying}
						variant="primary"
						isLoading={isRetrying && selectedAction === "retry"}
					>
						Retry
					</AnimatedButton>
				</div>
			</div>
		</div>
	);
}
