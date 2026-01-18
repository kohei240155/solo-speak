"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { HiMiniSpeakerWave } from "react-icons/hi2";
import { FaMicrophone } from "react-icons/fa";
import { IoStop } from "react-icons/io5";
import { useTranslation } from "@/hooks/ui/useTranslation";
import { useTextToSpeech } from "@/hooks/ui/useTextToSpeech";
import { useSpeechRecognition } from "@/hooks/practice/useSpeechRecognition";
import { calculateSimilarity } from "@/utils/similarity";
import { calculateDiff, DiffResult } from "@/utils/diff";
import { getDemoSample } from "@/constants/app-config";
import { useLanguage } from "@/contexts/LanguageContext";

interface SpeakingDemoProps {
	visibleSections: Set<string>;
}

// 正解とみなす閾値
const CORRECT_THRESHOLD = 0.9;

export default function SpeakingDemo({ visibleSections }: SpeakingDemoProps) {
	const { t } = useTranslation("landing");
	const { locale } = useLanguage();
	const [showResult, setShowResult] = useState(false);
	const [isResultVisible, setIsResultVisible] = useState(false);
	const [resultKey, setResultKey] = useState(0);
	const [matchRate, setMatchRate] = useState<number>(0);
	const [diffResult, setDiffResult] = useState<DiffResult[]>([]);
	const [isCorrect, setIsCorrect] = useState(false);
	const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);
	const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	// TTS機能の初期化 - デモサンプルに基づいて言語を決定
	const demoSample = getDemoSample(locale);
	const { isPlaying: isPlayingTTS, playText } = useTextToSpeech({
		languageCode: demoSample.voiceLanguage,
	});

	// 音声認識フック
	const {
		isRecording,
		isProcessing,
		isSupported,
		audioBlob,
		startRecording,
		stopRecording,
		resetRecording,
	} = useSpeechRecognition();

	// 録音データをURLに変換
	useEffect(() => {
		if (audioBlob) {
			const url = URL.createObjectURL(audioBlob);
			setUserAudioUrl(url);
			return () => URL.revokeObjectURL(url);
		}
	}, [audioBlob]);

	// 結果表示のフェードインアニメーション
	useEffect(() => {
		if (showResult && resultKey > 0) {
			// DOMレンダリング後にフェードイン開始
			const timer = setTimeout(() => {
				setIsResultVisible(true);
			}, 50);
			return () => clearTimeout(timer);
		}
	}, [showResult, resultKey]);

	// 録音停止処理
	const handleStopRecording = useCallback(() => {
		const result = stopRecording();

		if (result) {
			// 正解テキスト
			const expectedText = t("home.solutions.feature2.demo.input");

			// 一致率を計算
			const similarity = calculateSimilarity(result, expectedText);
			setMatchRate(similarity);

			// 差分を計算
			const diff = calculateDiff(result, expectedText);
			setDiffResult(diff);

			// 正解判定
			setIsCorrect(similarity >= CORRECT_THRESHOLD);

			// アニメーション用にリセットしてから結果を表示
			setIsResultVisible(false);
			setResultKey((prev) => prev + 1);
			setShowResult(true);
		}
	}, [stopRecording, t]);

	// 録音開始処理
	const handleStartRecording = useCallback(() => {
		resetRecording();
		setShowResult(false);
		setUserAudioUrl(null);
		// デモサンプルの言語に基づいて音声認識の言語を設定
		startRecording(demoSample.voiceLanguage);
	}, [startRecording, resetRecording, demoSample.voiceLanguage]);

	// もう一度試す
	const handleTryAgain = useCallback(() => {
		setIsResultVisible(false);
		resetRecording();
		setShowResult(false);
		setMatchRate(0);
		setDiffResult([]);
		setIsCorrect(false);
		setUserAudioUrl(null);
	}, [resetRecording]);

	// 正解音声再生
	const handlePlayTTS = async () => {
		if (isPlayingTTS) return;
		await playText(demoSample.text);
	};

	// 自分の録音を再生
	const handlePlayUserAudio = () => {
		if (!userAudioUrl || isPlayingUserAudio) return;

		const audio = new Audio(userAudioUrl);
		audioRef.current = audio;

		audio.onplay = () => setIsPlayingUserAudio(true);
		audio.onended = () => setIsPlayingUserAudio(false);
		audio.onerror = () => setIsPlayingUserAudio(false);

		audio.play();
	};

	// パーセンテージに応じた色を決定
	const getScoreColor = (percent: number) => {
		if (percent >= 90) return { stroke: "#22c55e", text: "text-green-500" };
		if (percent >= 70) return { stroke: "#f59e0b", text: "text-amber-500" };
		if (percent >= 50) return { stroke: "#eab308", text: "text-yellow-500" };
		return { stroke: "#ef4444", text: "text-red-500" };
	};

	const similarityPercent = Math.round(matchRate * 100);
	const scoreColor = getScoreColor(similarityPercent);

	// 差分ハイライト表示
	const renderDiffHighlight = () => {
		if (!diffResult || diffResult.length === 0) return null;

		// 正解テキスト（equal + delete）
		const expectedParts = diffResult.filter(
			(item) => item.type === "equal" || item.type === "delete"
		);

		// 発話テキスト（equal + insert）
		const transcriptParts = diffResult.filter(
			(item) => item.type === "equal" || item.type === "insert"
		);

		return (
			<div className="space-y-3">
				{/* 正解テキスト */}
				<div className="bg-gray-50 rounded-2xl p-4">
					<p className="text-xs text-gray-400 mb-2 font-medium">
						{t("home.solutions.feature2.demo.expectedLabel")}
					</p>
					<p className="leading-relaxed font-medium">
						{expectedParts.map((item, index) => (
							<span
								key={index}
								className={
									item.type === "equal" ? "text-green-600" : "text-red-500"
								}
							>
								{item.value}
							</span>
						))}
					</p>
				</div>

				{/* 発話テキスト */}
				<div className="bg-gray-50 rounded-2xl p-4">
					<p className="text-xs text-gray-400 mb-2 font-medium">
						{t("home.solutions.feature2.demo.yourSpeechLabel")}
					</p>
					<p className="leading-relaxed font-medium">
						{transcriptParts.map((item, index) => (
							<span
								key={index}
								className={
									item.type === "equal" ? "text-green-600" : "text-red-500"
								}
							>
								{item.value}
							</span>
						))}
					</p>
				</div>
			</div>
		);
	};

	return (
		<div
			id="feature-2"
			data-scroll-animation
			className={`flex flex-col lg:flex-row-reverse items-center gap-8 transition-all duration-1000 ease-out mx-0 lg:mx-auto max-w-none lg:max-w-7xl ${
				visibleSections.has("feature-2")
					? "opacity-100 translate-y-0"
					: "opacity-0 translate-y-8"
			}`}
			style={{
				opacity: visibleSections.has("feature-2") ? 1 : 0,
				transform: visibleSections.has("feature-2")
					? "translateY(0)"
					: "translateY(32px)",
			}}
		>
			<div className="lg:w-1/2 space-y-8">
				<div
					className="inline-flex items-center justify-center w-16 h-16 text-white rounded-2xl text-2xl font-bold mb-6 bg-gray-900"
				>
					{t("home.solutions.feature2.number")}
				</div>
				<h3 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
					{t("home.solutions.feature2.title")
						.split("\n")
						.map((line, index) => (
							<span key={index}>
								{line}
								{index <
									t("home.solutions.feature2.title").split("\n").length - 1 && (
									<br />
								)}
							</span>
						))}
				</h3>
				<p className="text-gray-600 text-lg md:text-xl leading-relaxed font-medium">
					{t("home.solutions.feature2.description")}
				</p>
			</div>
			<div className="lg:w-1/2">
				<div className="bg-white p-6 sm:p-8 md:p-10 rounded-3xl shadow-xl border border-gray-200 mx-0">
					<div className="w-full max-w-none lg:max-w-lg mx-auto">
						{/* 非対応ブラウザ表示 */}
						{!isSupported && (
							<div className="flex flex-col items-center justify-center min-h-[300px] text-center px-6">
								<div className="w-20 h-20 mb-6 rounded-full bg-gray-100 flex items-center justify-center">
									<FaMicrophone className="w-8 h-8 text-gray-400" />
								</div>
								<p className="text-gray-500 text-sm">
									{t("home.solutions.feature2.demo.notSupported")}
								</p>
							</div>
						)}

						{isSupported && (
							<>
								{/* 結果表示 */}
								{showResult ? (
									<div
										key={resultKey}
										className={`flex flex-col min-h-[350px] transition-all duration-700 ease-out ${
											isResultVisible
												? "opacity-100 translate-y-0"
												: "opacity-0 translate-y-4"
										}`}
									>
										{/* 結果ヘッダー */}
										<div className="text-center mb-6">
											{/* パーセンテージ表示 */}
											<div className="relative w-24 h-24 mb-4 mx-auto">
												<svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
													<circle
														cx="48"
														cy="48"
														r="42"
														fill="none"
														stroke="#e5e7eb"
														strokeWidth="8"
													/>
													<circle
														cx="48"
														cy="48"
														r="42"
														fill="none"
														stroke={scoreColor.stroke}
														strokeWidth="8"
														strokeLinecap="round"
														strokeDasharray={`${2 * Math.PI * 42}`}
														strokeDashoffset={`${2 * Math.PI * 42 * (1 - matchRate)}`}
														className="transition-all duration-500 ease-out"
													/>
												</svg>
												<div className="absolute inset-0 flex items-center justify-center">
													<span className={`text-2xl font-bold ${scoreColor.text}`}>
														{similarityPercent}%
													</span>
												</div>
											</div>

											{isCorrect ? (
												<h2 className="text-xl font-bold text-gray-900">
													{t("home.solutions.feature2.demo.passed")}
												</h2>
											) : (
												<>
													<h2 className="text-xl font-bold text-gray-900 mb-1">
														{t("home.solutions.feature2.demo.almostThere")}
													</h2>
													<p className="text-sm text-gray-500">
														{t("home.solutions.feature2.demo.passRequirement")}
													</p>
												</>
											)}
										</div>

										{/* 差分表示 */}
										<div className="flex-1 mb-6">
											{renderDiffHighlight()}
										</div>

										{/* 音声再生ボタン */}
										<div className="flex items-center justify-center gap-2 mb-6">
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
												{t("home.solutions.feature2.demo.hearCorrect")}
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
													{t("home.solutions.feature2.demo.myRecording")}
												</button>
											)}
										</div>

										{/* もう一度ボタン */}
										<button
											onClick={handleTryAgain}
											className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-medium transition-all duration-200 hover:bg-gray-800 active:scale-[0.98]"
										>
											{t("home.solutions.feature2.demo.tryAgain")}
										</button>
									</div>
								) : (
									<div className="flex flex-col min-h-[350px]">
										{/* 問題文 */}
										<div className="flex-1 flex flex-col items-center justify-center px-2">
											<p className="text-2xl sm:text-3xl font-semibold text-gray-900 text-center leading-relaxed">
												{t("home.solutions.feature2.demo.output")}
											</p>
										</div>

										{/* 録音ボタン */}
										<div className="mt-8 pb-4">
											{/* 処理中のステータス */}
											<div className="h-6 mb-4 text-center">
												{isProcessing && (
													<p className="text-sm text-gray-500">
														{t("home.solutions.feature2.demo.processing")}
													</p>
												)}
											</div>

											<div className="flex flex-col items-center">
												{isRecording ? (
													<button
														onClick={handleStopRecording}
														className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-transform duration-200 hover:scale-105 active:scale-95"
													>
														<IoStop className="w-8 h-8" />
													</button>
												) : isProcessing ? (
													<div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
														<div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
													</div>
												) : (
													<button
														onClick={handleStartRecording}
														className="w-20 h-20 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-lg shadow-gray-900/30 transition-transform duration-200 hover:scale-105 active:scale-95"
													>
														<FaMicrophone className="w-7 h-7" />
													</button>
												)}
												{/* ボタン下のテキスト（高さを固定してずれを防止） */}
												<div className="mt-4 h-5">
													{isRecording ? (
														<p className="text-sm text-gray-500 animate-pulse">
															{t("home.solutions.feature2.demo.recording")}
														</p>
													) : !isProcessing ? (
														<p className="text-sm text-gray-400">
															{t("home.solutions.feature2.demo.tapToSpeak")}
														</p>
													) : null}
												</div>
											</div>
										</div>
									</div>
								)}
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
