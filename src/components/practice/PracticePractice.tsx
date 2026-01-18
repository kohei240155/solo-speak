"use client";

import { useState, useCallback } from "react";
import { FaMicrophone } from "react-icons/fa";
import { IoStop } from "react-icons/io5";
import { HiArrowRight } from "react-icons/hi";
import { useSpeechRecognition } from "@/hooks/practice/useSpeechRecognition";
import { usePracticeAnswer } from "@/hooks/practice/usePracticeAnswer";
import { useTranslation } from "@/hooks/ui/useTranslation";
import PracticeResult from "./PracticeResult";
import StarProgress from "./StarProgress";
import type { PracticePhrase, PracticeMode } from "@/types/practice";
import type { PracticeSession } from "@/hooks/practice/usePracticeSession";
import { PRACTICE_MASTERY_COUNT } from "@/types/practice";

interface PracticePracticeProps {
	session: PracticeSession;
	currentPhrase: PracticePhrase;
	languageCode: string;
	onNext: () => void;
	onFinish: () => void;
	onRecordResult?: (correct: boolean, mastered: boolean) => void;
}

export default function PracticePractice({
	session,
	currentPhrase,
	languageCode,
	onNext,
	onFinish,
	onRecordResult,
}: PracticePracticeProps) {
	const { t } = useTranslation("app");
	const [showResult, setShowResult] = useState(false);
	const [noSpeechDetected, setNoSpeechDetected] = useState(false);

	const {
		isRecording,
		isProcessing,
		isSupported,
		audioBlob,
		startRecording,
		stopRecording,
		resetRecording,
		error: recognitionError,
	} = useSpeechRecognition();

	const { result, isSubmitting, submitAnswer, clearResult } =
		usePracticeAnswer();

	const handleStopRecording = useCallback(async () => {
		setNoSpeechDetected(false);
		const recognizedText = stopRecording();

		if (recognizedText) {
			const answerResult = await submitAnswer(
				currentPhrase.id,
				recognizedText,
				session.mode as PracticeMode
			);
			if (answerResult) {
				setShowResult(true);
				// 結果を記録
				onRecordResult?.(answerResult.correct, answerResult.isMastered);
			}
		} else {
			setNoSpeechDetected(true);
		}
	}, [stopRecording, submitAnswer, currentPhrase.id, session.mode, onRecordResult]);

	const handleStartRecording = useCallback(() => {
		resetRecording();
		clearResult();
		setShowResult(false);
		setNoSpeechDetected(false);
		startRecording(languageCode);
	}, [startRecording, resetRecording, clearResult, languageCode]);

	const handleNext = useCallback(() => {
		resetRecording();
		clearResult();
		setShowResult(false);

		const isLastPhrase = session.currentIndex >= session.phrases.length - 1;
		if (isLastPhrase) {
			onFinish();
		} else {
			onNext();
		}
	}, [
		resetRecording,
		clearResult,
		session.currentIndex,
		session.phrases.length,
		onFinish,
		onNext,
	]);

	const isLastPhrase = session.currentIndex >= session.phrases.length - 1;
	const progress = ((session.currentIndex + 1) / session.phrases.length) * 100;

	if (!isSupported) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[400px] text-center px-6">
				<div className="w-20 h-20 mb-6 rounded-full bg-gray-100 flex items-center justify-center">
					<FaMicrophone className="w-8 h-8 text-gray-400" />
				</div>
				<h3 className="text-lg font-semibold text-gray-800 mb-2">
					{t("speech.practice.speechUnavailable")}
				</h3>
				<p className="text-gray-500 text-sm">
					{t("speech.practice.useChromeOrEdge")}
				</p>
			</div>
		);
	}

	if (showResult && result) {
		return (
			<PracticeResult
				result={result}
				expectedText={currentPhrase.original}
				languageCode={languageCode}
				audioBlob={audioBlob}
				mode={session.mode}
				currentIndex={session.currentIndex}
				totalPhrases={session.phrases.length}
				onNext={handleNext}
			/>
		);
	}

	return (
		<div className="flex flex-col min-h-[500px]">
			{/* ヘッダー: プログレス */}
			<div className="mb-8">
				<div className="flex items-center justify-between mb-3">
					<span className="text-sm font-medium text-gray-500">
						{t("speech.practice.progress", {
							current: session.currentIndex + 1,
							total: session.phrases.length,
						})}
					</span>
					<StarProgress
						current={currentPhrase.practiceCorrectCount}
						total={PRACTICE_MASTERY_COUNT}
						mode={session.mode}
					/>
				</div>
				<div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
					<div
						className="h-full bg-gray-800 rounded-full transition-all duration-500 ease-out"
						style={{ width: `${progress}%` }}
					/>
				</div>
			</div>

			{/* エラー/警告メッセージ（スペースを常に確保） */}
			<div className="h-12 mb-2">
				{recognitionError && (
					<div className="px-4 py-3 bg-red-50 rounded-2xl">
						<p className="text-red-600 text-sm text-center">{recognitionError}</p>
					</div>
				)}
				{noSpeechDetected && (
					<div className="px-4 py-3 bg-amber-50 rounded-2xl">
						<p className="text-amber-700 text-sm text-center">
							{t("speech.practice.noSpeechDetected")}
						</p>
					</div>
				)}
			</div>

			{/* メインコンテンツ: 問題文 */}
			<div className="flex-1 flex flex-col items-center justify-center px-2">
				<p className="text-2xl sm:text-3xl font-semibold text-gray-900 text-center leading-relaxed">
					{currentPhrase.translation}
				</p>
			</div>

			{/* フッター: 録音ボタン */}
			<div className="relative mt-8 pb-4">
				{/* 処理中のステータス（スペースを常に確保） */}
				<div className="h-6 mb-4 text-center">
					{(isProcessing || isSubmitting) && (
						<p className="text-sm text-gray-500">
							{isProcessing
								? t("speech.practice.processing")
								: t("speech.practice.checkingAnswer")}
						</p>
					)}
				</div>

				{/* 録音ボタン */}
				<div className="flex flex-col items-center">
					{isRecording ? (
						<button
							onClick={handleStopRecording}
							className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-transform duration-200 hover:scale-105 active:scale-95"
						>
							<IoStop className="w-8 h-8" />
						</button>
					) : isProcessing || isSubmitting ? (
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
								{t("speech.practice.listening")}
							</p>
						) : !isProcessing && !isSubmitting ? (
							<p className="text-sm text-gray-400">
								{t("speech.practice.tapToSpeak")}
							</p>
						) : null}
					</div>
				</div>

				{/* スキップボタン（右側に配置） */}
				<div className="absolute right-4 top-1/2 -translate-y-1/2">
					{!isRecording && !isProcessing && !isSubmitting && (
						<button
							onClick={handleNext}
							className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors"
							aria-label={
								isLastPhrase
									? t("speech.practice.finishSession")
									: t("speech.practice.skipPhrase")
							}
						>
								<HiArrowRight className="w-5 h-5" />
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
