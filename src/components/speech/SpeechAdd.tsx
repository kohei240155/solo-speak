import { BsFillMicFill } from "react-icons/bs";
import { LuSendHorizontal } from "react-icons/lu";
import { RiDeleteBin6Line } from "react-icons/ri";
import { BsFillPlayFill, BsPauseFill } from "react-icons/bs";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/utils/spabase";

type SpeechAddProps = {
	learningLanguage?: string;
};

export default function SpeechAdd({ learningLanguage }: SpeechAddProps) {
	const [isRecording, setIsRecording] = useState(false);
	const [recordingTime, setRecordingTime] = useState(0);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isTranscribing, setIsTranscribing] = useState(false);
	const [transcribedText, setTranscribedText] = useState<string>("");
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const MAX_RECORDING_TIME = 90; // 1分半（90秒）

	// 録音時間のフォーマット
	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	// 録音開始
	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			streamRef.current = stream;

			const mediaRecorder = new MediaRecorder(stream);
			mediaRecorderRef.current = mediaRecorder;

			const chunks: Blob[] = [];

			mediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) {
					chunks.push(e.data);
				}
			};

			mediaRecorder.onstop = () => {
				const blob = new Blob(chunks, { type: "audio/webm" });
				setAudioBlob(blob);

				// ストリームを停止
				if (streamRef.current) {
					streamRef.current.getTracks().forEach((track) => track.stop());
					streamRef.current = null;
				}
			};

			mediaRecorder.start();
			setIsRecording(true);
			setRecordingTime(0);

			// タイマー開始
			timerRef.current = setInterval(() => {
				setRecordingTime((prev) => {
					if (prev >= MAX_RECORDING_TIME - 1) {
						stopRecording();
						return MAX_RECORDING_TIME;
					}
					return prev + 1;
				});
			}, 1000);
		} catch (error) {
			console.error("録音の開始に失敗しました:", error);
			alert(
				"マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。",
			);
		}
	};

	// 録音停止
	const stopRecording = () => {
		if (mediaRecorderRef.current && isRecording) {
			mediaRecorderRef.current.stop();
			setIsRecording(false);

			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
		}
	};

	// 録音データを削除
	const deleteRecording = () => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current = null;
		}
		setAudioBlob(null);
		setRecordingTime(0);
		setIsPlaying(false);

		if (isRecording) {
			stopRecording();
		}
	};

	// 音声再生/一時停止
	const togglePlayback = () => {
		if (!audioBlob) return;

		if (!audioRef.current) {
			const audio = new Audio(URL.createObjectURL(audioBlob));
			audioRef.current = audio;

			audio.onended = () => {
				setIsPlaying(false);
			};
		}

		if (isPlaying) {
			audioRef.current.pause();
			setIsPlaying(false);
		} else {
			audioRef.current.play();
			setIsPlaying(true);
		}
	};

	// クリーンアップ
	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
			}
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current = null;
			}
		};
	}, []);

	// 録音/停止ボタンのハンドラー
	const handleRecordButtonClick = () => {
		if (isRecording) {
			stopRecording();
		} else {
			startRecording();
		}
	};

	// 文字起こし実行
	const handleTranscribe = async () => {
		if (!audioBlob) return;

		setIsTranscribing(true);
		try {
			// Supabaseセッションからアクセストークンを取得
			const {
				data: { session },
			} = await supabase.auth.getSession();

			if (!session) {
				throw new Error("ログインが必要です");
			}

			// FormDataを作成してBlobを追加
			const formData = new FormData();
			// Blobをファイルとして追加（ファイル名と拡張子を指定）
			formData.append("file", audioBlob, "recording.webm");
			// 学習言語を指定（Whisperの精度向上のため）
			if (learningLanguage) {
				formData.append("language", learningLanguage);
			}

			const response = await fetch("/api/speech/transcribe", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${session.access_token}`,
				},
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "文字起こしに失敗しました");
			}

			const data = await response.json();
			setTranscribedText(data.text);
		} catch (error) {
			console.error("文字起こしエラー:", error);
			alert(
				error instanceof Error ? error.message : "文字起こしに失敗しました",
			);
		} finally {
			setIsTranscribing(false);
		}
	};

	return (
		<>
			{/* Add Speech見出しとLeft情報 */}
			<div className="flex justify-between items-center mb-2">
				<h2 className="text-xl md:text-2xl font-bold text-gray-900">
					Add Speech
				</h2>
				<div className="text-sm text-gray-600">Left: 1 / 1</div>
			</div>

			{/* Titleセクション */}
			<div className="mb-4">
				<h3 className="text-lg font-semibold text-gray-900 mb-2">Title</h3>
				<input
					type="text"
					placeholder="友達とアメフトを見に行った時の話"
					className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm focus:outline-none text-gray-900 placeholder-gray-300"
				/>
			</div>

			{/* Speech Planセクション */}
			<div className="mb-6">
				<h3 className="text-lg font-semibold text-gray-900 mb-2">
					Speech Plan
				</h3>
				<div className="space-y-2">
					{[1, 2, 3, 4, 5].map((index) => (
						<div
							key={index}
							className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-3"
						>
							<input
								type="text"
								placeholder="友達とアメフトを見に行った時の話"
								className="flex-1 text-sm focus:outline-none text-gray-900 placeholder-gray-300"
							/>
							<button className="flex-shrink-0 text-gray-600 hover:text-gray-800">
								<RiDeleteBin6Line size={20} />
							</button>
						</div>
					))}
				</div>
			</div>

			{/* Addボタン */}
			<div className="flex justify-end mb-8">
				<button
					className="px-6 py-2 text-white rounded-md font-medium transition-colors"
					style={{ backgroundColor: "#616161" }}
					onMouseEnter={(e) => {
						e.currentTarget.style.backgroundColor = "#525252";
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.backgroundColor = "#616161";
					}}
				>
					Add
				</button>
			</div>

			{/* 録音エリア */}
			<div className="pt-2">
				{/* タイマー表示 */}
				<div className="text-center mb-6">
					<div
						className={`text-2xl font-bold ${isRecording ? "text-red-600" : "text-gray-900"}`}
					>
						{formatTime(recordingTime)}
					</div>
					{isRecording && (
						<div className="text-sm text-red-600 mt-1">録音中...</div>
					)}
					{audioBlob && !isRecording && (
						<div className="flex items-center justify-center gap-2 mt-1">
							<div className="text-sm text-green-600">録音完了</div>
							<button
								className="w-6 h-6 rounded-full bg-gray-600 hover:bg-gray-700 flex items-center justify-center text-white transition-colors"
								onClick={togglePlayback}
								title={isPlaying ? "一時停止" : "再生"}
							>
								{isPlaying ? (
									<BsPauseFill size={12} />
								) : (
									<BsFillPlayFill size={12} />
								)}
							</button>
						</div>
					)}
				</div>

				{/* コントロールボタン */}
				<div className="flex justify-center items-center gap-8">
					{/* 削除ボタン */}
					<button
						className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={deleteRecording}
						disabled={!audioBlob && !isRecording}
					>
						<RiDeleteBin6Line size={24} />
					</button>

					{/* 録音ボタン（中央・大きめ） */}
					<button
						className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-colors shadow-lg ${
							isRecording ? "animate-pulse" : ""
						}`}
						style={{ backgroundColor: isRecording ? "#ef4444" : "#616161" }}
						onMouseEnter={(e) => {
							if (!isRecording) {
								e.currentTarget.style.backgroundColor = "#525252";
							}
						}}
						onMouseLeave={(e) => {
							if (!isRecording) {
								e.currentTarget.style.backgroundColor = "#616161";
							}
						}}
						onClick={handleRecordButtonClick}
					>
						<BsFillMicFill size={32} />
					</button>

					{/* 送信ボタン */}
					<button
						className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={!audioBlob || isRecording || isTranscribing}
						onClick={handleTranscribe}
					>
						<LuSendHorizontal size={24} />
					</button>
				</div>

				{/* 文字起こし結果表示 */}
				{isTranscribing && (
					<div className="mt-6 text-center text-gray-600">文字起こし中...</div>
				)}
				{transcribedText && (
					<div className="mt-6">
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							文字起こし結果
						</h3>
						<div className="border border-gray-300 rounded-md px-4 py-3 bg-gray-50 text-gray-900">
							{transcribedText}
						</div>
					</div>
				)}
			</div>
		</>
	);
}
