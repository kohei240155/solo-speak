"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// Web Speech API の型定義
interface SpeechRecognitionEvent extends Event {
	results: SpeechRecognitionResultList;
	resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
	error: string;
	message: string;
}

interface SpeechRecognition extends EventTarget {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	start: () => void;
	stop: () => void;
	abort: () => void;
	onresult: ((event: SpeechRecognitionEvent) => void) | null;
	onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
	onend: (() => void) | null;
	onstart: (() => void) | null;
}

interface SpeechRecognitionConstructor {
	new (): SpeechRecognition;
}

declare global {
	interface Window {
		SpeechRecognition?: SpeechRecognitionConstructor;
		webkitSpeechRecognition?: SpeechRecognitionConstructor;
	}
}

// 言語コードをBCP 47形式にマッピング
const LANGUAGE_CODE_MAP: Record<string, string> = {
	en: "en-US",
	ja: "ja-JP",
	de: "de-DE",
	es: "es-ES",
	fr: "fr-FR",
	ko: "ko-KR",
	pt: "pt-BR",
	th: "th-TH",
	zh: "zh-CN",
};

export interface UseSpeechRecognitionReturn {
	isRecording: boolean;
	isProcessing: boolean;
	isSupported: boolean;
	transcript: string;
	audioBlob: Blob | null;
	startRecording: (languageCode: string) => void;
	stopRecording: () => string;
	resetRecording: () => void;
	error: string | null;
}

/**
 * 音声認識と音声録音を行うフック
 * Web Speech API と MediaRecorder を使用
 */
export function useSpeechRecognition(): UseSpeechRecognitionReturn {
	const [isRecording, setIsRecording] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [transcript, setTranscript] = useState("");
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isSupported, setIsSupported] = useState(true);

	const recognitionRef = useRef<SpeechRecognition | null>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const finalTranscriptRef = useRef<string>("");

	// ブラウザ対応確認
	useEffect(() => {
		const SpeechRecognitionAPI =
			window.SpeechRecognition || window.webkitSpeechRecognition;
		if (!SpeechRecognitionAPI) {
			setIsSupported(false);
		}
	}, []);

	const startRecording = useCallback(async (languageCode: string) => {
		setError(null);
		setTranscript("");
		setAudioBlob(null);
		setIsProcessing(false);
		audioChunksRef.current = [];
		finalTranscriptRef.current = "";

		const SpeechRecognitionAPI =
			window.SpeechRecognition || window.webkitSpeechRecognition;

		if (!SpeechRecognitionAPI) {
			setError("Speech recognition is not supported in this browser");
			return;
		}

		try {
			// マイクアクセスを取得
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

			// MediaRecorder をセットアップ（自分の発話を録音）
			const mediaRecorder = new MediaRecorder(stream);
			mediaRecorderRef.current = mediaRecorder;

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunksRef.current.push(event.data);
				}
			};

			mediaRecorder.onstop = () => {
				const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
				setAudioBlob(blob);
				// ストリームを停止
				stream.getTracks().forEach((track) => track.stop());
			};

			// Speech Recognition をセットアップ
			const recognition = new SpeechRecognitionAPI();
			recognitionRef.current = recognition;

			recognition.continuous = true;
			recognition.interimResults = true;
			// 言語コードをBCP 47形式にマッピング
			recognition.lang = LANGUAGE_CODE_MAP[languageCode] || languageCode;

			recognition.onstart = () => {
				setIsRecording(true);
			};

			recognition.onresult = (event: SpeechRecognitionEvent) => {
				let finalTranscript = "";
				let interimTranscript = "";

				for (let i = 0; i < event.results.length; i++) {
					const result = event.results[i];
					if (result.isFinal) {
						finalTranscript += result[0].transcript;
					} else {
						interimTranscript += result[0].transcript;
					}
				}

				// 最終結果があればそれを使い、なければ中間結果を使う
				const currentTranscript = finalTranscript || interimTranscript;
				finalTranscriptRef.current = currentTranscript;
				setTranscript(currentTranscript);
			};

			recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
				if (event.error !== "aborted" && event.error !== "no-speech") {
					setError(`Speech recognition error: ${event.error}`);
				}
				setIsRecording(false);
				setIsProcessing(false);
			};

			recognition.onend = () => {
				setIsRecording(false);
				// MediaRecorder を停止
				if (
					mediaRecorderRef.current &&
					mediaRecorderRef.current.state === "recording"
				) {
					mediaRecorderRef.current.stop();
				}
				setIsProcessing(false);
			};

			// 録音開始
			mediaRecorder.start();
			recognition.start();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to start recording"
			);
			setIsRecording(false);
			setIsProcessing(false);
		}
	}, []);

	const stopRecording = useCallback((): string => {
		// 現在の認識結果を取得（refから直接取得）
		const result = finalTranscriptRef.current;

		// Speech Recognition を停止
		if (recognitionRef.current) {
			recognitionRef.current.stop();
		}

		// MediaRecorder を停止
		if (
			mediaRecorderRef.current &&
			mediaRecorderRef.current.state === "recording"
		) {
			mediaRecorderRef.current.stop();
		}

		setIsRecording(false);

		return result;
	}, []);

	const resetRecording = useCallback(() => {
		setTranscript("");
		setAudioBlob(null);
		setError(null);
		setIsProcessing(false);
		audioChunksRef.current = [];
		finalTranscriptRef.current = "";
	}, []);

	// クリーンアップ
	useEffect(() => {
		return () => {
			if (recognitionRef.current) {
				recognitionRef.current.abort();
			}
			if (
				mediaRecorderRef.current &&
				mediaRecorderRef.current.state === "recording"
			) {
				mediaRecorderRef.current.stop();
			}
		};
	}, []);

	return {
		isRecording,
		isProcessing,
		isSupported,
		transcript,
		audioBlob,
		startRecording,
		stopRecording,
		resetRecording,
		error,
	};
}
