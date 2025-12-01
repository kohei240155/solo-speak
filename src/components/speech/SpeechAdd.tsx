import { BsFillMicFill } from "react-icons/bs";
import { BiStop, BiPlay } from "react-icons/bi";
import { LuSendHorizontal } from "react-icons/lu";
import { RiDeleteBin6Line } from "react-icons/ri";
import { BsPauseFill } from "react-icons/bs";
import { useState, useRef, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LANGUAGE_NAMES, type LanguageCode } from "@/constants/languages";
import { SentenceData, FeedbackData } from "@/types/speech";
import { useRemainingSpeechCount } from "@/hooks/api/useReactQueryApi";
import { api } from "@/utils/api";

export interface CorrectionResult {
	title: string;
	speechPlan: string[];
	yourSpeech: string;
	sentences: SentenceData[];
	feedback: FeedbackData[];
	audioBlob: Blob | null;
	note: string;
}

interface SpeechAddProps {
	learningLanguage?: string;
	nativeLanguage?: string;
	onHasUnsavedChanges?: (hasChanges: boolean) => void;
	onCorrectionComplete?: (result: CorrectionResult) => void;
}

const speechFormSchema = z.object({
	title: z.string().max(50),
	speechPlanItems: z.array(
		z.object({
			value: z.string().max(100),
		}),
	),
	note: z.string().max(500).optional(),
});

type SpeechFormData = z.infer<typeof speechFormSchema>;

export default function SpeechAdd({
	learningLanguage,
	nativeLanguage,
	onHasUnsavedChanges,
	onCorrectionComplete,
}: SpeechAddProps) {
	const {
		remainingSpeechCount,
		isLoading: isLoadingRemaining,
		refetch: refetchRemainingSpeechCount,
	} = useRemainingSpeechCount();
	const [isRecording, setIsRecording] = useState(false);
	const [recordingTime, setRecordingTime] = useState(0);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isTranscribing, setIsTranscribing] = useState(false);
	const [transcribedText, setTranscribedText] = useState<string>("");
	const [isCorrecting, setIsCorrecting] = useState(false);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);

	const placeholders = [
		"今日はいつも通り仕事だった。",
		"午前中は集中できる時間が多かった。",
		"昼休みに公園まで散歩に行き気分転換ができてよかった。",
		"午後は少しバタバタしたけど、なんとか終わらせて定時に帰れた。",
		"今日は早く寝て、明日に備えようと思う。",
	];

	const {
		register,
		control,
		formState: { errors },
		watch,
	} = useForm<SpeechFormData>({
		resolver: zodResolver(speechFormSchema),
		mode: "onChange",
		defaultValues: {
			title: "",
			speechPlanItems: [{ value: "" }, { value: "" }, { value: "" }],
			note: "",
		},
	});

	const { fields, append, remove } = useFieldArray({
		control,
		name: "speechPlanItems",
	});

	const titleValue = watch("title");
	const speechPlanItemsValue = watch("speechPlanItems");
	const noteValue = watch("note");

	// バリデーションエラーがあるかチェック
	const hasValidationErrors =
		Object.keys(errors).length > 0 ||
		!titleValue ||
		titleValue.trim() === "" ||
		(titleValue && titleValue.length > 50) ||
		speechPlanItemsValue?.some((item) => item.value && item.value.length > 100);

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

	// 未保存の変更を親コンポーネントに通知
	useEffect(() => {
		if (onHasUnsavedChanges) {
			const hasChanges =
				titleValue?.trim().length > 0 ||
				speechPlanItemsValue?.some((item) => item.value?.trim().length > 0) ||
				audioBlob !== null ||
				transcribedText.length > 0;
			onHasUnsavedChanges(hasChanges);
		}
	}, [
		titleValue,
		speechPlanItemsValue,
		audioBlob,
		transcribedText,
		onHasUnsavedChanges,
	]);

	// 録音/停止/再生ボタンのハンドラー
	const handleRecordButtonClick = () => {
		if (isRecording) {
			stopRecording();
		} else if (audioBlob) {
			// 録音完了後は再生/一時停止
			togglePlayback();
		} else {
			startRecording();
		}
	};

	// 文字起こし実行
	const handleTranscribe = async () => {
		if (!audioBlob) return;

		setIsTranscribing(true);
		try {
			// FormDataを作成してBlobを追加
			const formData = new FormData();
			// Blobをファイルとして追加（ファイル名と拡張子を指定）
			formData.append("file", audioBlob, "recording.webm");
			// 学習言語を指定（Whisperの精度向上のため）
			if (learningLanguage) {
				formData.append("language", learningLanguage);
			}

			const data = await api.post<{ text: string }>(
				"/api/speech/transcribe",
				formData,
			);
			setTranscribedText(data.text);

			// 文字起こし成功後、自動的に添削を実行
			await handleCorrection(data.text);
		} catch (error) {
			console.error("文字起こしエラー:", error);
			alert(
				error instanceof Error ? error.message : "文字起こしに失敗しました",
			);
		} finally {
			setIsTranscribing(false);
		}
	};

	// 添削実行
	const handleCorrection = async (transcribed: string) => {
		setIsCorrecting(true);
		try {
			// タイトルとスピーチプランの値を取得
			const title = titleValue.trim();
			const planItems = speechPlanItemsValue
				.map((item) => item.value.trim())
				.filter((item) => item.length > 0);

			if (!title || planItems.length === 0) {
				throw new Error("タイトルまたはスピーチプランが入力されていません");
			}

			// 言語名を取得（言語コードから表示名に変換）
			const learningLangName = learningLanguage
				? LANGUAGE_NAMES[learningLanguage as LanguageCode] || learningLanguage
				: learningLanguage || "";
			const nativeLangName = nativeLanguage
				? LANGUAGE_NAMES[nativeLanguage as LanguageCode] || nativeLanguage
				: nativeLanguage || "";

			if (!learningLangName || !nativeLangName) {
				throw new Error("学習言語と母国語が設定されていません");
			}

			const data = await api.post<{
				sentences: SentenceData[];
				feedback: FeedbackData[];
			}>(
				"/api/speech/correct",
				{
					title,
					speechPlanItems: planItems,
					transcribedText: transcribed,
					learningLanguage: learningLangName,
					nativeLanguage: nativeLangName,
				},
				{ timeout: 120000 }, // 120秒のタイムアウト（OpenAI APIの処理時間を考慮）
			); // 添削成功後、残回数を再取得
			await refetchRemainingSpeechCount();

			// 添削完了データを親に渡す
			if (onCorrectionComplete) {
				onCorrectionComplete({
					title: titleValue.trim(),
					speechPlan: speechPlanItemsValue
						.map((item) => item.value.trim())
						.filter((item) => item.length > 0),
					yourSpeech: transcribed,
					sentences: data.sentences,
					feedback: data.feedback,
					audioBlob: audioBlob,
					note: noteValue || "",
				});
			}
		} catch (error) {
			console.error("添削エラー:", error);
			alert(error instanceof Error ? error.message : "添削に失敗しました");
		} finally {
			setIsCorrecting(false);
		}
	};

	// Speech Plan項目を追加
	const handleAddItems = () => {
		if (fields.length < 5) {
			append({ value: "" });
		}
	};

	// Speech Plan項目を削除
	const handleDeleteItem = (index: number) => {
		if (fields.length > 1) {
			remove(index);
		}
	};

	return (
		<>
			{/* Add Speech見出しとLeft情報 */}
			<div className="flex justify-between items-center mb-2">
				<h2 className="text-xl md:text-2xl font-bold text-gray-900">
					Add Speech
				</h2>
				<div>
					{isLoadingRemaining ? (
						<span className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-200 rounded-full">
							Loading...
						</span>
					) : (
						<span
							className={`px-3 py-1 text-sm font-medium rounded-full ${
								remainingSpeechCount === 0
									? "bg-red-100 text-red-700"
									: "bg-green-100 text-green-700"
							}`}
						>
							{remainingSpeechCount === 0 ? "Unavailable" : "Available"}
						</span>
					)}
				</div>
			</div>

			{/* Titleセクション */}
			<div className="mb-4">
				<h3 className="text-lg font-semibold text-gray-900 mb-2">Title</h3>
				<textarea
					{...register("title")}
					placeholder="今日あったことの振り返り"
					className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm focus:outline-none text-gray-900 placeholder-gray-300 resize-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 overflow-hidden"
					rows={1}
					onInput={(e) => {
						const target = e.target as HTMLTextAreaElement;
						target.style.height = "auto";
						target.style.height = `${target.scrollHeight}px`;
					}}
					disabled={
						isTranscribing || isCorrecting || remainingSpeechCount === 0
					}
				/>
				{errors.title && (
					<p className="text-red-500 text-xs mt-1">
						タイトルは50文字以内で入力してください
					</p>
				)}
			</div>

			{/* Speech Planセクション */}
			<div className="mb-6">
				<h3 className="text-lg font-semibold text-gray-900 mb-2">
					Speech Plan
				</h3>
				<div className="space-y-2">
					{fields.map((field, index) => (
						<div key={field.id}>
							<div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-3">
								<textarea
									{...register(`speechPlanItems.${index}.value`)}
									placeholder={placeholders[index]}
									className="flex-1 text-sm focus:outline-none text-gray-900 placeholder-gray-300 resize-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 overflow-hidden"
									rows={1}
									onInput={(e) => {
										const target = e.target as HTMLTextAreaElement;
										target.style.height = "auto";
										target.style.height = `${target.scrollHeight}px`;
									}}
									disabled={
										isTranscribing || isCorrecting || remainingSpeechCount === 0
									}
								/>
								<button
									type="button"
									className={`flex-shrink-0 ${fields.length === 1 || isTranscribing || isCorrecting || remainingSpeechCount === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:text-gray-800"}`}
									onClick={() => handleDeleteItem(index)}
									disabled={
										fields.length === 1 ||
										isTranscribing ||
										isCorrecting ||
										remainingSpeechCount === 0
									}
								>
									<RiDeleteBin6Line size={20} />
								</button>
							</div>
							{errors.speechPlanItems?.[index]?.value && (
								<p className="text-red-500 text-xs mt-1">
									100文字以内で入力してください
								</p>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Addボタン */}
			<div className="flex justify-end mb-8">
				<button
					type="button"
					className={`px-6 py-2 text-white rounded-md font-medium transition-colors ${fields.length >= 5 || isTranscribing || isCorrecting || remainingSpeechCount === 0 ? "cursor-not-allowed opacity-50" : ""}`}
					style={{ backgroundColor: "#616161" }}
					onMouseEnter={(e) => {
						if (
							fields.length < 5 &&
							!isTranscribing &&
							!isCorrecting &&
							remainingSpeechCount !== 0
						) {
							e.currentTarget.style.backgroundColor = "#525252";
						}
					}}
					onMouseLeave={(e) => {
						if (
							fields.length < 5 &&
							!isTranscribing &&
							!isCorrecting &&
							remainingSpeechCount !== 0
						) {
							e.currentTarget.style.backgroundColor = "#616161";
						}
					}}
					onClick={handleAddItems}
					disabled={
						fields.length >= 5 ||
						isTranscribing ||
						isCorrecting ||
						remainingSpeechCount === 0
					}
				>
					Add
				</button>
			</div>

			{/* 録音エリア */}
			<div className="pt-2">
				{/* タイマー表示 */}
				<div className="text-center mb-6">
					<div className="text-2xl font-bold text-gray-900">
						{formatTime(MAX_RECORDING_TIME - recordingTime)}
					</div>
				</div>

				{/* コントロールボタン */}
				<div className="flex justify-center items-center gap-8">
					{/* 削除ボタン */}
					<button
						className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={deleteRecording}
						disabled={
							!audioBlob ||
							isRecording ||
							isTranscribing ||
							isCorrecting ||
							remainingSpeechCount === 0
						}
					>
						<RiDeleteBin6Line size={24} />
					</button>

					{/* 録音/再生ボタン（中央・大きめ） */}
					<button
						className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
							isRecording ? "animate-pulse" : ""
						}`}
						style={{ backgroundColor: "#616161" }}
						onMouseEnter={(e) => {
							if (
								!hasValidationErrors &&
								!isTranscribing &&
								!isCorrecting &&
								remainingSpeechCount !== 0
							) {
								e.currentTarget.style.backgroundColor = "#525252";
							}
						}}
						onMouseLeave={(e) => {
							if (
								!hasValidationErrors &&
								!isTranscribing &&
								!isCorrecting &&
								remainingSpeechCount !== 0
							) {
								e.currentTarget.style.backgroundColor = "#616161";
							}
						}}
						onClick={handleRecordButtonClick}
						disabled={
							hasValidationErrors ||
							isTranscribing ||
							isCorrecting ||
							remainingSpeechCount === 0
						}
					>
						{isRecording ? (
							<BiStop size={40} />
						) : audioBlob ? (
							isPlaying ? (
								<BsPauseFill size={32} />
							) : (
								<BiPlay size={40} />
							)
						) : (
							<BsFillMicFill size={32} />
						)}
					</button>

					{/* 送信ボタン */}
					<button
						className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={
							!audioBlob ||
							isRecording ||
							isTranscribing ||
							isCorrecting ||
							remainingSpeechCount === 0
						}
						onClick={handleTranscribe}
					>
						{isTranscribing || isCorrecting ? (
							<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600" />
						) : (
							<LuSendHorizontal size={24} />
						)}
					</button>
				</div>
			</div>
		</>
	);
}
