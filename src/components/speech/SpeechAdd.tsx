import { BsFillMicFill } from "react-icons/bs";
import { BiStop, BiPlay } from "react-icons/bi";
import { LuSendHorizontal } from "react-icons/lu";
import { RiDeleteBin6Line } from "react-icons/ri";
import { BsPauseFill } from "react-icons/bs";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/utils/spabase";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import SpeechResult from "./SpeechResult";
import { LANGUAGE_NAMES, type LanguageCode } from "@/constants/languages";
import { saveSpeech } from "@/hooks/speech/useSaveSpeech";
import { SentenceData, FeedbackData } from "@/types/speech";
import { useAuth } from "@/contexts/AuthContext";
import { useRemainingSpeechCount } from "@/hooks/api/useReactQueryApi";

interface SpeechAddProps {
	learningLanguage?: string;
	nativeLanguage?: string;
	onHasUnsavedChanges?: (hasChanges: boolean) => void;
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
}: SpeechAddProps) {
	const { userSettings } = useAuth();
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
	const [sentences, setSentences] = useState<SentenceData[]>([]);
	const [feedback, setFeedback] = useState<FeedbackData[]>([]);
	const [showResult, setShowResult] = useState(false);
	const [useMockData, setUseMockData] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);

	const {
		register,
		control,
		formState: { errors },
		watch,
		setValue,
	} = useForm<SpeechFormData>({
		resolver: zodResolver(speechFormSchema),
		mode: "onChange",
		defaultValues: {
			title: "いま作っているアプリの話",
			speechPlanItems: [
				{ value: "自分でアプリを開発した" },
				{ value: "既に完成しているけど新しい機能を追加したいと思っている" },
				{ value: "英語を話して文字起こしされた文章をAIが添削してくれる" },
			],
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

	const placeholders = [
		"今日から独り言を使ったスピーキングの勉強を始めた。",
		"きっかけは、独り言の練習ができるアプリを見つけたことだった。",
		"やってみたら、思った以上に難しいことがわかった。",
		"特に、言いたいことがすぐ出てこない場面が多かった。",
		"それでも効果はありそうだと思ったので、明日も続けてみようと思う。",
	];
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const MAX_RECORDING_TIME = 90; // 1分半（90秒）

	// モックデータを読み込む関数
	const loadMockRecording = async () => {
		try {
			// Next.jsではpublicフォルダ直下のファイルは/からアクセス
			// しかしmockフォルダはsrc外なので、動的インポートを使用
			const response = await fetch("/api/mock/recorded");
			if (!response.ok) {
				throw new Error("モックデータが見つかりません");
			}
			const blob = await response.blob();
			setAudioBlob(blob);
			setRecordingTime(45); // 45秒の録音を想定
		} catch (error) {
			console.error("モックデータの読み込みに失敗しました:", error);
			alert("モックデータの読み込みに失敗しました");
		}
	};

	// useMockDataの変更を監視して、モック録音を自動ロード
	useEffect(() => {
		if (useMockData && !audioBlob) {
			loadMockRecording();
		} else if (!useMockData && audioBlob) {
			// モードをOFFにした場合、録音をクリア（直接実装）
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current = null;
			}
			setAudioBlob(null);
			setRecordingTime(0);
			setIsPlaying(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [useMockData]);

	// textareaの高さを自動調整
	const autoResizeTextarea = (element: HTMLTextAreaElement) => {
		element.style.height = "auto";
		element.style.height = `${element.scrollHeight}px`;
	};

	// 録音時間のフォーマット
	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	// 録音開始
	const startRecording = async () => {
		// モックモードの場合は録音をスキップ
		if (useMockData) {
			return;
		}

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
				!showResult &&
				(titleValue?.trim().length > 0 ||
					speechPlanItemsValue?.some((item) => item.value?.trim().length > 0) ||
					audioBlob !== null ||
					transcribedText.length > 0);
			onHasUnsavedChanges(hasChanges);
		}
	}, [
		titleValue,
		speechPlanItemsValue,
		audioBlob,
		transcribedText,
		showResult,
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
			// モックデータモードの場合
			if (useMockData) {
				// モック文字起こしデータを読み込む
				const response = await fetch("/api/mock/transcribe");
				if (!response.ok) {
					throw new Error("モックデータが見つかりません");
				}
				const data = await response.json();
				setTranscribedText(data.text);

				// 添削も自動実行（モックデータを使用）
				await handleCorrection(data.text, "", true);
				return;
			}

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

			// 文字起こし成功後、自動的に添削を実行
			await handleCorrection(data.text, session.access_token);
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
	const handleCorrection = async (
		transcribed: string,
		accessToken: string,
		isMock = false,
	) => {
		setIsCorrecting(true);
		try {
			// モックデータモードの場合
			if (isMock) {
				// 3秒間待機
				await new Promise((resolve) => setTimeout(resolve, 3000));

				// モック添削データを読み込む
				const response = await fetch("/api/mock/correct");
				if (!response.ok) {
					throw new Error("モックデータが見つかりません");
				}
				const data = await response.json();
				setSentences(data.sentences);
				setFeedback(data.feedback);
				setShowResult(true);
				return;
			}

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

			const response = await fetch("/api/speech/correct", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title,
					speechPlanItems: planItems,
					transcribedText: transcribed,
					learningLanguage: learningLangName,
					nativeLanguage: nativeLangName,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "添削に失敗しました");
			}

			const data = await response.json();
			setSentences(data.sentences);
			setFeedback(data.feedback);
			setShowResult(true);

			// 添削成功後、残回数を再取得
			await refetchRemainingSpeechCount();
		} catch (error) {
			console.error("添削エラー:", error);
			alert(error instanceof Error ? error.message : "添削に失敗しました");
		} finally {
			setIsCorrecting(false);
		}
	};

	// 保存処理
	const handleSave = async () => {
		if (!userSettings) {
			toast.error("User settings not found");
			return;
		}

		if (
			!userSettings.defaultLearningLanguageId ||
			!userSettings.nativeLanguageId
		) {
			toast.error("Please set your languages in settings");
			return;
		}

		setIsSaving(true);
		try {
			const result = await saveSpeech(
				{
					title: titleValue,
					learningLanguageId: userSettings.defaultLearningLanguageId,
					nativeLanguageId: userSettings.nativeLanguageId,
					firstSpeechText: transcribedText,
					notes: noteValue,
					speechPlans: speechPlanItemsValue
						.map((item) => item.value)
						.filter((item) => item.trim().length > 0),
					sentences: sentences,
					feedback: feedback,
				},
				audioBlob,
			);

			toast.success("Speech saved successfully!");
			console.log("Saved speech:", result);

			// 保存成功後、フォームをリセット
			setShowResult(false);
			setTranscribedText("");
			setSentences([]);
			setFeedback([]);
			setAudioBlob(null);
		} catch (error) {
			console.error("Failed to save speech:", error);
			// エラーはapi.tsで自動的にトースト表示される
		} finally {
			setIsSaving(false);
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
			{showResult ? (
				<SpeechResult
					title={titleValue}
					speechPlan={speechPlanItemsValue
						.map((item) => item.value)
						.filter((item) => item.trim().length > 0)}
					yourSpeech={transcribedText}
					sentences={sentences}
					feedback={feedback}
					audioBlob={audioBlob}
					onSave={handleSave}
					isSaving={isSaving}
					note={noteValue}
					onNoteChange={(note) => setValue("note", note)}
				/>
			) : (
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

					{/* モックデータトグル */}
					<div className="mb-4 flex items-center justify-end gap-2">
						<span className="text-sm text-gray-600">Mock Mode</span>
						<button
							onClick={() => setUseMockData(!useMockData)}
							className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
								useMockData ? "bg-blue-600" : "bg-gray-300"
							}`}
						>
							<span
								className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
									useMockData ? "translate-x-6" : "translate-x-1"
								}`}
							/>
						</button>
					</div>

					{/* Titleセクション */}
					<div className="mb-4">
						<h3 className="text-lg font-semibold text-gray-900 mb-2">Title</h3>
						<textarea
							{...register("title")}
							placeholder="独り言を使ってスピーキングの練習を始めたこと"
							className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm focus:outline-none text-gray-900 placeholder-gray-300 resize-none overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
							rows={1}
							onChange={(e) => {
								register("title").onChange(e);
								autoResizeTextarea(e.target);
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
									<div className="flex items-start gap-2 border border-gray-300 rounded-md px-3 py-3">
										<textarea
											{...register(`speechPlanItems.${index}.value`)}
											placeholder={placeholders[index]}
											className="flex-1 text-sm focus:outline-none text-gray-900 placeholder-gray-300 resize-none overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
											rows={1}
											onChange={(e) => {
												register(`speechPlanItems.${index}.value`).onChange(e);
												autoResizeTextarea(e.target);
											}}
											disabled={
												isTranscribing ||
												isCorrecting ||
												remainingSpeechCount === 0
											}
										/>
										<button
											type="button"
											className={`flex-shrink-0 mt-1 ${fields.length === 1 || isTranscribing || isCorrecting || remainingSpeechCount === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:text-gray-800"}`}
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
										(!hasValidationErrors || (useMockData && audioBlob)) &&
										!isTranscribing &&
										!isCorrecting &&
										remainingSpeechCount !== 0
									) {
										e.currentTarget.style.backgroundColor = "#525252";
									}
								}}
								onMouseLeave={(e) => {
									if (
										(!hasValidationErrors || (useMockData && audioBlob)) &&
										!isTranscribing &&
										!isCorrecting &&
										remainingSpeechCount !== 0
									) {
										e.currentTarget.style.backgroundColor = "#616161";
									}
								}}
								onClick={handleRecordButtonClick}
								disabled={
									(hasValidationErrors && !(useMockData && audioBlob)) ||
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
			)}
		</>
	);
}
