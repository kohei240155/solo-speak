"use client";

import { useRef, useEffect, useState } from "react";
import { HiMiniSpeakerWave } from "react-icons/hi2";
import { FaMicrophone } from "react-icons/fa";
import { useTextToSpeech } from "@/hooks/ui/useTextToSpeech";
import { useTranslation } from "@/hooks/ui/useTranslation";
import DiffHighlight from "./DiffHighlight";
import StarProgress from "./StarProgress";
import PracticeButton from "@/components/common/PracticeButton";
import type { PracticeResultState, PracticeMode } from "@/types/practice";
import { PRACTICE_MASTERY_COUNT } from "@/types/practice";

interface PracticeResultProps {
	result: PracticeResultState;
	expectedText: string;
	languageCode: string;
	audioBlob: Blob | null;
	mode: PracticeMode;
	currentIndex: number;
	totalPhrases: number;
	onNext: () => void;
}

export default function PracticeResult({
	result,
	expectedText,
	languageCode,
	audioBlob,
	mode,
	currentIndex,
	totalPhrases,
	onNext,
}: PracticeResultProps) {
	const { t } = useTranslation("app");
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);
	const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);

	const { isPlaying: isPlayingTTS, playText } = useTextToSpeech({
		languageCode,
	});

	useEffect(() => {
		if (audioBlob) {
			const url = URL.createObjectURL(audioBlob);
			setUserAudioUrl(url);
			return () => URL.revokeObjectURL(url);
		}
	}, [audioBlob]);

	const handlePlayTTS = async () => {
		if (isPlayingTTS) return;
		await playText(expectedText);
	};

	const handlePlayUserAudio = () => {
		if (!userAudioUrl || isPlayingUserAudio) return;

		const audio = new Audio(userAudioUrl);
		audioRef.current = audio;

		audio.onplay = () => setIsPlayingUserAudio(true);
		audio.onended = () => setIsPlayingUserAudio(false);
		audio.onerror = () => setIsPlayingUserAudio(false);

		audio.play();
	};

	const similarityPercent = Math.round(result.similarity * 100);
	const progress = ((currentIndex + 1) / totalPhrases) * 100;

	// パーセンテージに応じた色を決定
	const getScoreColor = (percent: number) => {
		if (percent >= 90) return { stroke: "#22c55e", text: "text-green-500" }; // 緑
		if (percent >= 70) return { stroke: "#f59e0b", text: "text-amber-500" }; // オレンジ
		if (percent >= 50) return { stroke: "#eab308", text: "text-yellow-500" }; // 黄色
		return { stroke: "#ef4444", text: "text-red-500" }; // 赤
	};
	const scoreColor = getScoreColor(similarityPercent);

	// パーセンテージに応じたタイトルを取得（不合格時）
	const getIncorrectTitle = (percent: number) => {
		if (percent >= 70) return t("speech.practice.almostThere");
		if (percent >= 50) return t("speech.practice.keepGoing");
		return t("speech.practice.letsPractice");
	};

	return (
		<div className="flex flex-col min-h-[500px]">
			{/* プログレスバー */}
			<div className="mb-8">
				<div className="flex items-center justify-between mb-3">
					<span className="text-sm font-medium text-gray-500">
						{t("speech.practice.progress", {
							current: currentIndex + 1,
							total: totalPhrases,
						})}
					</span>
					<StarProgress
						current={result.newCorrectCount}
						total={PRACTICE_MASTERY_COUNT}
						mode={mode}
					/>
				</div>
				<div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
					<div
						className="h-full bg-gray-800 rounded-full transition-all duration-500 ease-out"
						style={{ width: `${progress}%` }}
					/>
				</div>
			</div>

			{/* 結果ヘッダー */}
			<div className="text-center mb-8">
				{/* パーセンテージ表示（合格・不合格共通） */}
				<div className="relative w-24 h-24 mb-4 mx-auto">
					{/* 背景の円 */}
					<svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
						<circle
							cx="48"
							cy="48"
							r="42"
							fill="none"
							stroke="#e5e7eb"
							strokeWidth="8"
						/>
						{/* 進捗の円 */}
						<circle
							cx="48"
							cy="48"
							r="42"
							fill="none"
							stroke={scoreColor.stroke}
							strokeWidth="8"
							strokeLinecap="round"
							strokeDasharray={`${2 * Math.PI * 42}`}
							strokeDashoffset={`${2 * Math.PI * 42 * (1 - similarityPercent / 100)}`}
							className="transition-all duration-500 ease-out"
						/>
					</svg>
					{/* 中央のパーセント表示 */}
					<div className="absolute inset-0 flex items-center justify-center">
						<span className={`text-2xl font-bold ${scoreColor.text}`}>
							{similarityPercent}%
						</span>
					</div>
				</div>

				{result.correct ? (
					<h2 className="text-2xl font-bold text-gray-900">
						{result.isMastered
							? t("speech.practice.mastered")
							: t("speech.practice.passed")}
					</h2>
				) : (
					<>
						<h2 className="text-2xl font-bold text-gray-900 mb-1">
							{getIncorrectTitle(similarityPercent)}
						</h2>
						<p className="text-sm text-gray-500">
							{t("speech.practice.passRequirement")}
						</p>
					</>
				)}
			</div>

			{/* 差分表示 */}
			<div className="flex-1">
				<DiffHighlight
					diffResult={result.diffResult}
					className="text-base sm:text-lg"
				/>
			</div>

			{/* 音声再生ボタン */}
			<div className="flex items-center justify-center gap-2 my-6">
				<button
					onClick={handlePlayTTS}
					disabled={isPlayingTTS}
					className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
						isPlayingTTS
							? "bg-gray-100 text-gray-400"
							: "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95"
					}`}
				>
					<HiMiniSpeakerWave
						className={`w-4 h-4 ${isPlayingTTS ? "animate-pulse" : ""}`}
					/>
					{t("speech.practice.hearCorrect")}
				</button>

				{userAudioUrl && (
					<button
						onClick={handlePlayUserAudio}
						disabled={isPlayingUserAudio}
						className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
							isPlayingUserAudio
								? "bg-gray-100 text-gray-400"
								: "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95"
						}`}
					>
						<FaMicrophone
							className={`w-3.5 h-3.5 ${isPlayingUserAudio ? "animate-pulse" : ""}`}
						/>
						{t("speech.practice.myRecording")}
					</button>
				)}
			</div>

			{/* 次へボタン */}
			<PracticeButton onClick={onNext} variant="primary">
				{t("speech.practice.continue")}
			</PracticeButton>
		</div>
	);
}
