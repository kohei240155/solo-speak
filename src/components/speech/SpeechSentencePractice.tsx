import { useState, useEffect } from "react";
import { CiCirclePlus } from "react-icons/ci";
import { HiMiniSpeakerWave } from "react-icons/hi2";
import { RiSpeakLine } from "react-icons/ri";
import { useTextToSpeech } from "@/hooks/ui/useTextToSpeech";
import AnimatedButton from "../common/AnimatedButton";

interface SpeechPhrase {
	id: string;
	speechOrder: number;
	original: string;
	translation: string;
}

interface SpeechSentencePracticeProps {
	phrases: SpeechPhrase[];
	currentIndex: number;
	onNext: () => void;
	onFinish: () => void;
	learningLanguageCode: string;
	learningLanguageName: string;
	nativeLanguageName: string;
}

export default function SpeechSentencePractice({
	phrases,
	currentIndex,
	onNext,
	onFinish,
	learningLanguageCode,
}: SpeechSentencePracticeProps) {
	const currentPhrase = phrases[currentIndex];
	const isLastPhrase = currentIndex === phrases.length - 1;
	const [countCooldown, setCountCooldown] = useState(0);

	// TTS機能の初期化
	const { isPlaying, playText } = useTextToSpeech({
		languageCode: learningLanguageCode,
	});

	// カウントダウンの管理
	useEffect(() => {
		let timer: NodeJS.Timeout;
		if (countCooldown > 0) {
			timer = setTimeout(() => {
				setCountCooldown(countCooldown - 1);
			}, 1000);
		}
		return () => clearTimeout(timer);
	}, [countCooldown]);

	// Soundボタンのハンドラー
	const handleSound = async () => {
		if (!currentPhrase?.original || isPlaying) return;

		try {
			await playText(currentPhrase.original);
		} catch {
			// 音声再生失敗は無視
		}
	};

	// Countボタンのハンドラー
	const handleCount = () => {
		if (countCooldown > 0) return;
		setCountCooldown(1);
	};

	// カウントボタンの無効状態判定
	const isCountButtonDisabled = countCooldown > 0;

	if (!currentPhrase) {
		return null;
	}

	return (
		<>
			{/* フレーズ表示エリア - SpeakPracticeと同じレイアウト */}
			<div className="mb-6 relative">
				{/* 学習言語のフレーズ（メイン表示） */}
				<div className="mb-2">
					<div className="text-base sm:text-lg md:text-xl font-medium text-gray-900 break-words leading-relaxed">
						{currentPhrase.original}
					</div>
				</div>

				{/* 母国語の翻訳 */}
				<div className="mb-3">
					<div className="text-sm sm:text-base md:text-lg text-gray-600 break-words leading-relaxed">
						{currentPhrase.translation}
					</div>
				</div>

				{/* 進捗表示 */}
				<div className="flex items-center text-sm text-gray-600 min-w-0">
					<RiSpeakLine className="w-4 h-4 mr-1 flex-shrink-0" />
					<span className="break-words">
						{currentIndex + 1} / {phrases.length}
					</span>
				</div>
			</div>

			{/* Sound と Count ボタン */}
			<div>
				<div className="flex justify-between items-start">
					{/* Count ボタン + Finish ボタン */}
					<div className="flex flex-col items-center" style={{ width: "45%" }}>
						<button
							onClick={handleCount}
							disabled={isCountButtonDisabled}
							className={`flex flex-col items-center focus:outline-none mb-4 transition-colors rounded-lg p-6 w-full min-h-[120px] ${
								isCountButtonDisabled
									? "cursor-not-allowed opacity-50"
									: "cursor-pointer"
							}`}
						>
							<div
								className={`w-[60px] h-[40px] bg-white rounded-full flex items-center justify-center mb-2 ${
									isCountButtonDisabled ? "opacity-50" : ""
								}`}
							>
								<CiCirclePlus
									className={`w-10 h-10 ${
										isCountButtonDisabled ? "text-gray-400" : "text-gray-600"
									}`}
								/>
							</div>
							<span
								className={`font-medium text-base ${
									isCountButtonDisabled ? "text-gray-400" : "text-gray-900"
								}`}
							>
								{countCooldown > 0 ? "Wait..." : "Count"}
							</span>
						</button>
						<AnimatedButton
							onClick={onFinish}
							variant="secondary"
							className="px-6"
						>
							Finish
						</AnimatedButton>
					</div>

					{/* 区切り線 - 上部に配置 */}
					<div className="w-px h-20 bg-gray-300 mx-4"></div>

					{/* Sound ボタン + Next ボタン */}
					<div className="flex flex-col items-center" style={{ width: "45%" }}>
						<button
							onClick={handleSound}
							disabled={isPlaying || !currentPhrase?.original}
							className={`flex flex-col items-center focus:outline-none mb-4 transition-colors rounded-lg p-6 w-full min-h-[120px] ${
								isPlaying || !currentPhrase?.original
									? "cursor-not-allowed opacity-50"
									: "cursor-pointer"
							}`}
						>
							<div
								className={`w-[60px] h-[40px] bg-white rounded-full flex items-center justify-center mb-2 ${
									isPlaying ? "animate-pulse" : ""
								}`}
							>
								<HiMiniSpeakerWave
									className={`w-10 h-10 ${
										isPlaying || !currentPhrase?.original
											? "text-gray-400"
											: "text-gray-900"
									}`}
								/>
							</div>
							<span
								className={`font-medium text-base ${
									isPlaying || !currentPhrase?.original
										? "text-gray-400"
										: "text-gray-900"
								}`}
							>
								{isPlaying ? "Playing..." : "Sound"}
							</span>
						</button>
						{isLastPhrase ? (
							<AnimatedButton
								onClick={onFinish}
								variant="primary"
								className="px-6"
							>
								Finish
							</AnimatedButton>
						) : (
							<AnimatedButton
								onClick={onNext}
								variant="primary"
								className="px-6"
							>
								Next
							</AnimatedButton>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
