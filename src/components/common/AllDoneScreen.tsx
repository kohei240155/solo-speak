import { useState } from "react";
import { FaMedal, FaTrophy, FaStar } from "react-icons/fa";
import PracticeButton from "./PracticeButton";

// セッション統計情報（オプション）
export interface SessionStats {
	correctCount: number;  // 今回の正解数
	weeklyRank: number;    // 今週の順位
	totalRank: number;     // 累計順位
}

interface AllDoneScreenProps {
	onFinish: () => void;
	onRetry: () => void;
	stats?: SessionStats;      // オプショナルな統計情報
}

export default function AllDoneScreen({
	onFinish,
	onRetry,
	stats,
}: AllDoneScreenProps) {
	const [isFinishing, setIsFinishing] = useState(false);
	const [isRetrying, setIsRetrying] = useState(false);
	const [selectedAction, setSelectedAction] = useState<
		"finish" | "retry" | null
	>(null);

	const handleFinish = async () => {
		setSelectedAction("finish");
		setIsFinishing(true);
		await new Promise((resolve) => setTimeout(resolve, 300));
		onFinish();
		setIsFinishing(false);
		setSelectedAction(null);
	};

	const handleRetry = async () => {
		setSelectedAction("retry");
		setIsRetrying(true);
		await new Promise((resolve) => setTimeout(resolve, 300));
		onRetry();
		setIsRetrying(false);
		setSelectedAction(null);
	};

	return (
		<div className="flex flex-col min-h-[380px]">
			{/* ヘッダー */}
			<div className="text-center pt-8 pb-2">
				<h1 className="text-[34px] font-bold text-gray-800 tracking-tight">
					Complete!
				</h1>
				<p className="text-gray-400 text-[13px] mt-1 font-medium">セッション終了</p>
			</div>

			{/* スペーサー（コンテンツを下に寄せる） */}
			<div className="flex-1"></div>

			{/* 統計情報 */}
			{stats && (
				<div className="mx-3 mb-8">
					<div className="grid grid-cols-3 gap-3">
						{/* 今回の正解数 */}
						<div className="bg-white rounded-xl py-4 px-2 shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-100">
							<div className="flex justify-center mb-2">
								<FaStar className="w-5 h-5 text-gray-300" />
							</div>
							<div className="text-[26px] font-bold text-gray-800 text-center leading-none">
								{stats.correctCount}
							</div>
							<div className="text-[11px] text-gray-400 text-center mt-2 font-medium">今回の正解</div>
						</div>

						{/* 今週の順位 */}
						<div className="bg-white rounded-xl py-4 px-2 shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-100">
							<div className="flex justify-center mb-2">
								<FaMedal className="w-5 h-5 text-blue-400" />
							</div>
							<div className="text-[26px] font-bold text-gray-800 text-center leading-none">
								{stats.weeklyRank}<span className="text-[14px] font-normal text-gray-500">位</span>
							</div>
							<div className="text-[11px] text-gray-400 text-center mt-2 font-medium">今週の順位</div>
						</div>

						{/* 累計順位 */}
						<div className="bg-white rounded-xl py-4 px-2 shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-100">
							<div className="flex justify-center mb-2">
								<FaTrophy className="w-5 h-5 text-amber-400" />
							</div>
							<div className="text-[26px] font-bold text-gray-800 text-center leading-none">
								{stats.totalRank}<span className="text-[14px] font-normal text-gray-500">位</span>
							</div>
							<div className="text-[11px] text-gray-400 text-center mt-2 font-medium">累計順位</div>
						</div>
					</div>
				</div>
			)}

			{/* ボタン */}
			<div className="flex gap-3 px-3">
				<div className="flex-1">
					<PracticeButton
						onClick={handleFinish}
						disabled={isFinishing || isRetrying}
						variant="secondary"
						isLoading={isFinishing && selectedAction === "finish"}
					>
						終了
					</PracticeButton>
				</div>
				<div className="flex-1">
					<PracticeButton
						onClick={handleRetry}
						disabled={isFinishing || isRetrying}
						variant="primary"
						isLoading={isRetrying && selectedAction === "retry"}
					>
						もう一度
					</PracticeButton>
				</div>
			</div>
		</div>
	);
}
