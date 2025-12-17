import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/hooks/ui/useTranslation";
import {
	AiOutlineLineChart,
	AiOutlineCaretRight,
	AiOutlineQuestionCircle,
} from "react-icons/ai";
import { BsPauseFill, BsFillMicFill } from "react-icons/bs";
import { BiPlay, BiStop } from "react-icons/bi";
import { IoCheckboxOutline } from "react-icons/io5";
import { GiChart } from "react-icons/gi";
import { RiSpeakLine } from "react-icons/ri";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { SpeechReviewResponseData } from "@/types/speech";
import toast from "react-hot-toast";
import SpeechStatusModal, {
	SpeechStatus,
} from "@/components/modals/SpeechStatusModal";
import SpeechReviewHelpModal from "@/components/modals/SpeechReviewHelpModal";
import { api } from "@/utils/api";
import AnimatedButton from "@/components/common/AnimatedButton";
import { useSaveSpeechNotes } from "@/hooks/speech/useSaveSpeechNotes";
import { useUpdateSpeechStatus } from "@/hooks/speech/useUpdateSpeechStatus";
import { useSpeechSentences } from "@/hooks/speech";
import { useUpdatePhraseCount } from "@/hooks/phrase/useUpdatePhraseCount";
import { useRecordSpeechPractice } from "@/hooks/speech";
import SpeakPractice from "@/components/speak/SpeakPractice";
import { useTextToSpeech } from "@/hooks/ui/useTextToSpeech";

interface SpeechReviewProps {
	speech: NonNullable<SpeechReviewResponseData["speech"]>;
	pendingCount: number;
	setPendingCount: (count: number) => void;
	viewMode: ViewMode;
	setViewMode: (mode: ViewMode) => void;
	onRefetchSpeechById: () => void;
}

type ViewMode = "review" | "practice";

export default function SpeechReview({
	speech,
	pendingCount,
	setPendingCount,
	viewMode,
	setViewMode,
	onRefetchSpeechById,
}: SpeechReviewProps) {
	const { t } = useTranslation("app");
	const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
	const [activeTab, setActiveTab] = useState<"Script" | "Feedback" | "Note">(
		"Script",
	);
	const [isPlaying, setIsPlaying] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [isAudioLoading, setIsAudioLoading] = useState(false);

	// React Query hooks
	const saveNotesMutation = useSaveSpeechNotes();
	const updateStatusMutation = useUpdateSpeechStatus();
	const updatePhraseCountMutation = useUpdatePhraseCount();
	const recordPracticeMutation = useRecordSpeechPractice();
	const {
		sentences,
		isLoading: isSentencesLoading,
		refetch: refetchSentences,
	} = useSpeechSentences({
		speechId: speech.id,
		enabled: false, // 最初は無効化、ボタン押下時に取得
	});

	// Next/Finishボタンのローディング状態
	const [isNextLoading, setIsNextLoading] = useState(false);
	const [isFinishLoading, setIsFinishLoading] = useState(false);

	// ステータス変更モーダルの状態
	const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
	const [statuses, setStatuses] = useState<SpeechStatus[]>([]);
	const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
	const [isOpeningStatusModal, setIsOpeningStatusModal] = useState(false);
	const [isStartingPractice, setIsStartingPractice] = useState(false);

	// ユーザー録音用の状態
	const [isRecording, setIsRecording] = useState(false);
	const [recordingTime, setRecordingTime] = useState(90); // 1:30 = 90秒
	const [userAudioBlob, setUserAudioBlob] = useState<Blob | null>(null);
	const [isUserAudioPlaying, setIsUserAudioPlaying] = useState(false);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const userAudioRef = useRef<HTMLAudioElement | null>(null);
	const recordingStartTimeRef = useRef<number | null>(null);
	const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// ノートの編集状態
	const [notes, setNotes] = useState(speech.notes || "");
	const [showHelpModal, setShowHelpModal] = useState(false);

	// TTS機能の初期化
	const {
		isPlaying: isPlayingLearning,
		playText: playLearningText,
		stopAudio: stopLearningAudio,
	} = useTextToSpeech({
		languageCode: speech.learningLanguage.code,
	});

	// 学習言語のフレーズ全文を結合
	const learningText = speech.phrases.map((p) => p.original).join(" ");

	// TTS再生/停止のハンドラー
	const handleToggleLearningAudio = () => {
		if (isPlayingLearning) {
			stopLearningAudio();
		} else {
			playLearningText(learningText);
		}
	};

	// タブのスタイル
	const getTabStyle = (tab: "Script" | "Feedback" | "Note") => {
		const isActive = activeTab === tab;
		return `flex-1 pb-3 text-base font-semibold transition-colors ${
			isActive
				? "text-gray-900 border-b-2 border-gray-900"
				: "text-gray-500 hover:text-gray-700"
		}`;
	};

	// 音声再生/一時停止
	const handlePlayAudio = async () => {
		if (!speech.audioFilePath) {
			toast.error("No audio file path available");
			return;
		}

		// 既存の音声オブジェクトがある場合
		if (audioRef.current) {
			if (isPlaying) {
				audioRef.current.pause();
				setIsPlaying(false);
				return;
			}

			// 一時停止中の音声を再開
			try {
				await audioRef.current.play();
				setIsPlaying(true);
			} catch {
				toast.error("Failed to play audio");
				audioRef.current = null;
				setIsPlaying(false);
			}
			return;
		}

		// 新しい音声オブジェクトを作成（Safari対応：直接URLを使用）
		setIsAudioLoading(true);

		try {
			// Safari対応：fetch/blob経由をやめて直接URLを使用

			const audio = new Audio(speech.audioFilePath);
			audioRef.current = audio;

			// 音量を最大に設定
			audio.volume = 1.0;

			// イベントリスナーを設定
			audio.onended = () => {
				setIsPlaying(false);
			};

			audio.onerror = () => {
				setIsPlaying(false);
				setIsAudioLoading(false);

				toast.error("Failed to load audio", { duration: 8000 });

				audioRef.current = null;
			};

			// Safari対応：ユーザーインタラクション内で即座にplay()を呼ぶ
			audio
				.play()
				.then(() => {
					setIsPlaying(true);
					setIsAudioLoading(false);
				})
				.catch(() => {
					toast.error("Failed to play audio");
					audioRef.current = null;
					setIsPlaying(false);
					setIsAudioLoading(false);
				});
		} catch {
			toast.error("Failed to load audio");
			audioRef.current = null;
			setIsPlaying(false);
			setIsAudioLoading(false);
		}
	}; // ユーザー録音の開始
	const startUserRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			streamRef.current = stream;

			// Safari対応：利用可能な最適なMIMEタイプを選択
			let mimeType = "audio/webm;codecs=opus";
			const possibleTypes = [
				"audio/mp4", // iOS Safari最適（AAC）
				"audio/webm;codecs=opus",
				"audio/webm",
				"audio/ogg;codecs=opus",
			];

			for (const type of possibleTypes) {
				if (MediaRecorder.isTypeSupported(type)) {
					mimeType = type;
					break;
				}
			}

			const mediaRecorder = new MediaRecorder(stream, { mimeType });
			mediaRecorderRef.current = mediaRecorder;

			const chunks: Blob[] = [];

			mediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) {
					chunks.push(e.data);
				}
			};

			mediaRecorder.onstop = () => {
				// 録音時間をチェック
				const recordingDuration = recordingStartTimeRef.current
					? (Date.now() - recordingStartTimeRef.current) / 1000
					: 0;

				// 10秒以上の場合のみBlobを保存
				if (recordingDuration >= 3) {
					const blob = new Blob(chunks, { type: mimeType });
					setUserAudioBlob(blob);
				}

				// ストリームを停止
				if (streamRef.current) {
					streamRef.current.getTracks().forEach((track) => track.stop());
					streamRef.current = null;
				}

				// 使用済みなのでクリア
				recordingStartTimeRef.current = null;
			};

			mediaRecorder.start();
			setIsRecording(true);
			recordingStartTimeRef.current = Date.now();
			setRecordingTime(90);

			// タイマー開始
			timerIntervalRef.current = setInterval(() => {
				setRecordingTime((prev) => {
					if (prev <= 1) {
						// 時間切れで自動停止
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		} catch {
			alert(t("speech.review.micAccessDenied"));
		}
	};

	// ユーザー録音の停止
	const stopUserRecording = () => {
		if (mediaRecorderRef.current && isRecording) {
			// タイマーをクリア
			if (timerIntervalRef.current) {
				clearInterval(timerIntervalRef.current);
				timerIntervalRef.current = null;
			}

			// 録音時間をチェック
			const recordingDuration = recordingStartTimeRef.current
				? (Date.now() - recordingStartTimeRef.current) / 1000
				: 0;

			if (recordingDuration < 10) {
				// 録音時間が10秒未満の場合
				toast.error(t("speech.review.recordingTooShort"));
				// ストリームを停止
				if (streamRef.current) {
					streamRef.current.getTracks().forEach((track) => track.stop());
					streamRef.current = null;
				}
				// MediaRecorderを停止（ondatavailableは発火するが保存しない）
				mediaRecorderRef.current.stop();
				setIsRecording(false);
				recordingStartTimeRef.current = null;
				setRecordingTime(90); // タイマーをリセット
				// userAudioBlobは設定しないので録音ボタンの表示のまま
				return;
			}

			// 10秒以上の場合は通常通り停止
			mediaRecorderRef.current.stop();
			setIsRecording(false);
			// recordingStartTimeRefはonstopで使うのでここではクリアしない
			// 録音完了後にトーストを表示
			toast.success(t("speech.review.recordingComplete"), {
				duration: 5000,
			});
		}
	};

	// ユーザー録音の再生/一時停止
	const handleUserAudioPlay = () => {
		if (!userAudioBlob) return;

		if (!userAudioRef.current) {
			const audio = new Audio(URL.createObjectURL(userAudioBlob));
			userAudioRef.current = audio;

			// 練習完了フラグ（重複実行防止）
			let practiceRecorded = false;

			audio.onended = () => {
				setIsUserAudioPlaying(false);

				// 重複実行防止
				if (practiceRecorded) return;

				// endedプロパティで本当に最後まで再生されたか確認
				// また、durationが有効な値かも確認
				if (!audio.ended || !isFinite(audio.duration) || audio.duration <= 0) {
					return;
				}

				// 追加チェック：currentTimeがdurationの90%以上進んでいることを確認
				// （onendedイベント発火時にcurrentTimeがリセットされることがあるため、
				//   endedプロパティと組み合わせてチェック）
				const playbackRatio = audio.currentTime / audio.duration;
				if (playbackRatio < 0.9 && audio.currentTime > 0.1) {
					// currentTimeが有効で、90%未満の場合は完了とみなさない
					return;
				}

				practiceRecorded = true;

				// トーストを表示
				toast.success("Review completed!");
				// Speech練習記録APIを呼び出す
				recordPracticeMutation.mutate(
					{ speechId: speech.id },
					{
						onSuccess: () => {
							// 練習回数を更新後、SpeechのIDを使って再取得
							onRefetchSpeechById();
						},
						onError: () => {
							toast.error("Failed to record practice");
						},
					},
				);
				// 録音データをリセット
				setTimeout(() => {
					if (userAudioRef.current) {
						userAudioRef.current = null;
					}
					setUserAudioBlob(null);
					setRecordingTime(90);
				}, 500);
			};

			// pauseイベントで一時停止時の状態を正しく反映
			audio.onpause = () => {
				// endedでない場合のみ一時停止状態を設定
				if (!audio.ended) {
					setIsUserAudioPlaying(false);
				}
			};

			audio.onerror = () => {
				setIsUserAudioPlaying(false);
			};

			// 新しく作成した音声を再生
			audio.play().catch(() => {
				setIsUserAudioPlaying(false);
			});
			setIsUserAudioPlaying(true);
			return;
		}

		if (isUserAudioPlaying) {
			userAudioRef.current.pause();
			setIsUserAudioPlaying(false);
		} else {
			userAudioRef.current.play().catch(() => {
				setIsUserAudioPlaying(false);
			});
			setIsUserAudioPlaying(true);
		}
	};

	// ユーザー録音ボタンのクリック処理
	const handleUserRecordButtonClick = () => {
		if (isRecording) {
			stopUserRecording();
		} else if (userAudioBlob) {
			handleUserAudioPlay();
		} else {
			startUserRecording();
		}
	};

	// クリーンアップ
	useEffect(() => {
		return () => {
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current = null;
			}
			if (userAudioRef.current) {
				userAudioRef.current.pause();
				userAudioRef.current = null;
			}
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
			}
			if (timerIntervalRef.current) {
				clearInterval(timerIntervalRef.current);
			}
		};
	}, []);

	// textareaの高さを初期化時と内容変更時に調整
	useEffect(() => {
		setTimeout(() => {
			const textareas =
				document.querySelectorAll<HTMLTextAreaElement>("textarea");
			textareas.forEach((textarea) => {
				textarea.style.height = "auto";
				textarea.style.height = `${textarea.scrollHeight}px`;
			});
		}, 0);
	}, [notes]);

	// センテンスプラクティスモードの開始
	const handleStartPractice = async () => {
		setIsStartingPractice(true);
		try {
			// センテンスデータを取得
			await refetchSentences();
			setViewMode("practice");
			setCurrentPhraseIndex(0);
		} finally {
			setIsStartingPractice(false);
		}
	};

	// カウントボタンのハンドラー
	const handleCountSpeech = () => {
		const currentSentence = sentences[currentPhraseIndex];
		if (!currentSentence) return;

		const newPendingCount = pendingCount + 1;
		const newDailyCount =
			(currentSentence.dailySpeakCount || 0) + newPendingCount;

		// 1日のカウント上限チェック（100回）
		if (newDailyCount > 100) {
			toast.error("Daily limit reached (100 times)", {
				duration: 4000,
			});
			return;
		}

		setPendingCount(newPendingCount);

		if (newDailyCount === 100) {
			toast.error("Daily limit reached (100 times)", {
				duration: 4000,
			});
		}
	};

	// 次のフレーズへ進む
	const handleNextPhrase = async () => {
		setIsNextLoading(true);
		try {
			const currentSentence = sentences[currentPhraseIndex];

			// ペンディングカウントがある場合は送信
			if (pendingCount > 0 && currentSentence) {
				try {
					await updatePhraseCountMutation.mutateAsync({
						phraseId: currentSentence.id,
						count: pendingCount,
					});
					setPendingCount(0);
					// センテンスデータを再取得して更新されたカウントを反映
					await refetchSentences();
				} catch {
					toast.error("Failed to update count");
					return;
				}
			} else if (currentSentence) {
				// カウントが0でもsession_spokenをtrueに設定
				try {
					await updatePhraseCountMutation.mutateAsync({
						phraseId: currentSentence.id,
						count: 0,
					});
				} catch {
					// session_spoken設定エラーは次のフレーズ取得を阻害しない
				}
			}

			if (currentPhraseIndex < sentences.length - 1) {
				setCurrentPhraseIndex(currentPhraseIndex + 1);
			}
		} finally {
			setIsNextLoading(false);
		}
	};

	// プラクティス完了
	const handleFinishPractice = async () => {
		setIsFinishLoading(true);
		try {
			const currentSentence = sentences[currentPhraseIndex];

			// ペンディングカウントがある場合は送信
			if (pendingCount > 0 && currentSentence) {
				try {
					await updatePhraseCountMutation.mutateAsync({
						phraseId: currentSentence.id,
						count: pendingCount,
					});
					setPendingCount(0);
				} catch {
					toast.error("Failed to update count");
					return;
				}
			} else if (currentSentence) {
				// カウントが0でもsession_spokenをtrueに設定
				try {
					await updatePhraseCountMutation.mutateAsync({
						phraseId: currentSentence.id,
						count: 0,
					});
				} catch {
					// エラーは無視
				}
			}

			// Review画面に戻る
			setViewMode("review");
			setCurrentPhraseIndex(0);
		} finally {
			setIsFinishLoading(false);
		}
	};

	// ステータス一覧を取得
	const fetchStatuses = async () => {
		setIsLoadingStatuses(true);
		try {
			const data = await api.get<{ statuses: SpeechStatus[] }>(
				"/api/speech/statuses",
			);
			setStatuses(data.statuses);
		} catch {
			toast.error("Failed to load statuses");
		} finally {
			setIsLoadingStatuses(false);
		}
	};

	// ステータス変更処理
	const handleStatusChange = async (statusId: string) => {
		await updateStatusMutation.mutateAsync({
			speechId: speech.id,
			statusId,
		});
	};

	// ステータスモーダルを開く
	const handleOpenStatusModal = async () => {
		setIsOpeningStatusModal(true);
		try {
			if (statuses.length === 0) {
				await fetchStatuses();
			}
			setIsStatusModalOpen(true);
		} finally {
			setIsOpeningStatusModal(false);
		}
	};

	// ノート保存処理
	const handleSaveNotes = async () => {
		await saveNotesMutation.mutateAsync({
			speechId: speech.id,
			notes,
		});
	};

	// プラクティスモードの場合
	if (viewMode === "practice") {
		const currentSentence = sentences[currentPhraseIndex] || null;
		const isLastSentence = currentPhraseIndex >= sentences.length - 1;

		return (
			<SpeakPractice
				phrase={currentSentence}
				onCount={handleCountSpeech}
				onNext={handleNextPhrase}
				onFinish={handleFinishPractice}
				todayCount={(currentSentence?.dailySpeakCount ?? 0) + pendingCount}
				totalCount={(currentSentence?.totalSpeakCount ?? 0) + pendingCount}
				isLoading={isSentencesLoading}
				isNextLoading={isNextLoading}
				isHideNext={isLastSentence}
				isFinishing={isFinishLoading}
				isCountDisabled={false}
				learningLanguage={speech.learningLanguage.code}
				onExplanation={
					currentSentence?.explanation
						? () => {
								toast.success(currentSentence.explanation || "");
							}
						: undefined
				}
			/>
		);
	}

	// Review画面（デフォルト）
	return (
		<div className="max-w-4xl mx-auto">
			{/* Header with checkmark, practice count, and fullscreen */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<h1 className="text-2xl font-bold text-gray-900">Review Speech</h1>
					<button
						onClick={() => setShowHelpModal(true)}
						className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
					>
						<AiOutlineQuestionCircle size={20} />
					</button>
				</div>
				<div className="flex items-center gap-4">
					{/* Practice count */}
					<div className="flex items-center gap-2">
						<IoCheckboxOutline className="w-5 h-5 text-gray-700" />
						<span className="text-sm font-medium">{speech.practiceCount}</span>
					</div>
					{/* Status */}
					<div className="flex items-center gap-2">
						<GiChart className="w-5 h-5 text-gray-700" />
						<span className="text-sm font-medium">{speech.status.name}</span>
					</div>
				</div>
			</div>

			{/* Title */}
			<div className="mb-6">
				<h2 className="text-xl font-semibold text-gray-900 mb-2">Title</h2>
				<div className="text-base text-gray-900">{speech.title}</div>
			</div>
			{/* Tabs */}
			<div className="flex border-b border-gray-300 mb-6">
				<button
					type="button"
					className={getTabStyle("Script")}
					onClick={() => setActiveTab("Script")}
				>
					Script
				</button>
				<button
					type="button"
					className={getTabStyle("Feedback")}
					onClick={() => setActiveTab("Feedback")}
				>
					Feedback
				</button>
				<button
					type="button"
					className={getTabStyle("Note")}
					onClick={() => setActiveTab("Note")}
				>
					Note
				</button>
			</div>
			{/* Tab Content */}
			<div className="mb-6">
				{activeTab === "Script" && (
					<div className="space-y-6">
						<p className="text-sm text-gray-700 mb-4">
							{t("speech.review.practiceTip")}
						</p>
						<div>
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-lg font-semibold text-gray-900">
									{speech.learningLanguage.name}
								</h3>
								<button
									type="button"
									onClick={handleToggleLearningAudio}
									className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
								>
									{isPlayingLearning ? (
										<BiStop size={18} className="text-gray-600" />
									) : (
										<div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[7px] border-l-gray-600 border-b-[5px] border-b-transparent ml-1" />
									)}
								</button>
							</div>
							<div className="border border-gray-300 rounded-lg p-4 bg-white space-y-4">
								{speech.phrases.map((phrase) => (
									<p key={phrase.id} className="text-sm text-gray-900">
										{phrase.original}
									</p>
								))}
							</div>
						</div>
						<div>
							<h3 className="text-lg font-semibold text-gray-900 mb-3">
								{speech.nativeLanguage.name}
							</h3>
							<div className="border border-gray-300 rounded-lg p-4 bg-white space-y-4">
								{speech.phrases.map((phrase) => (
									<p key={phrase.id} className="text-sm text-gray-900">
										{phrase.translation}
									</p>
								))}
							</div>
						</div>
					</div>
				)}
				{activeTab === "Feedback" && (
					<div className="space-y-6">
						<p className="text-sm text-gray-700 mb-4">
							{t("speech.review.feedbackTip")}
						</p>
						{/* Your Speech Section */}
						<div>
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-xl font-semibold text-gray-900">
									Your Speech
								</h3>
								<div className="flex gap-2">
									{speech.audioFilePath && (
										<>
											<button
												type="button"
												onClick={handlePlayAudio}
												disabled={isAudioLoading}
												className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
											>
												{isAudioLoading ? (
													<AiOutlineLoading3Quarters
														size={18}
														className="text-gray-600 animate-spin"
													/>
												) : isPlaying ? (
													<BsPauseFill size={18} className="text-gray-600" />
												) : (
													<div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[7px] border-l-gray-600 border-b-[5px] border-b-transparent ml-1" />
												)}
											</button>
										</>
									)}
								</div>
							</div>

							<div className="border border-gray-300 rounded-lg p-4 bg-white">
								{speech.firstSpeechText ? (
									<p className="text-sm text-gray-900 whitespace-pre-wrap">
										{speech.firstSpeechText}
									</p>
								) : (
									<p className="text-gray-500 text-center py-4">
										No transcript available
									</p>
								)}
							</div>
						</div>{" "}
						{/* Feedback Section */}
						<div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								Feedback
							</h3>
							<div className="space-y-6">
								{speech.feedbacks.length > 0 ? (
									speech.feedbacks.map((feedback) => (
										<div key={feedback.id}>
											{/* Header */}
											<div className="flex items-center mb-3">
												<AiOutlineCaretRight
													size={16}
													className="text-gray-600 mr-1"
												/>
												<span className="font-medium text-gray-900 text-md">
													{feedback.category}
												</span>
											</div>

											{/* Content */}
											<div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
												<p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
													{feedback.content}
												</p>
											</div>
										</div>
									))
								) : (
									<div className="text-center py-8 text-gray-500">
										No feedback available
									</div>
								)}
							</div>
						</div>
					</div>
				)}{" "}
				{activeTab === "Note" && (
					<div className="space-y-4">
						<p className="text-sm text-gray-700">
							{t("speech.review.noteTip")}
						</p>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							onInput={(e) => {
								const target = e.target as HTMLTextAreaElement;
								target.style.height = "auto";
								target.style.height = `${target.scrollHeight}px`;
							}}
							placeholder={t("speech.notePlaceholder")}
							className="w-full min-h-[350px] p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-base text-gray-900 resize-none bg-white overflow-hidden"
						/>
						<AnimatedButton
							onClick={handleSaveNotes}
							disabled={saveNotesMutation.isPending}
							isLoading={saveNotesMutation.isPending}
							size="lg"
						>
							Save
						</AnimatedButton>
					</div>
				)}
			</div>
			{/* Audio Player */}
			{activeTab === "Script" && (
				<div className="pt-2">
					{/* タイマー表示 */}
					<div className="text-center mb-6">
						<div className="text-2xl font-bold text-gray-900">
							{Math.floor(recordingTime / 60)}:
							{String(recordingTime % 60).padStart(2, "0")}
						</div>
					</div>

					{/* コントロールボタン */}
					<div className="flex justify-center items-center gap-8">
						{/* Analytics button (左側) */}
						<button
							type="button"
							onClick={handleOpenStatusModal}
							disabled={isOpeningStatusModal}
							className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isOpeningStatusModal ? (
								<AiOutlineLoading3Quarters size={24} className="animate-spin" />
							) : (
								<AiOutlineLineChart size={24} />
							)}
						</button>

						{/* User Recording button (中央) - ユーザー録音 */}
						<button
							type="button"
							onClick={handleUserRecordButtonClick}
							className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-colors shadow-lg ${
								isRecording ? "animate-pulse" : ""
							}`}
							style={{ backgroundColor: "#616161" }}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = "#525252";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = "#616161";
							}}
						>
							{isRecording ? (
								<BiStop size={40} />
							) : userAudioBlob ? (
								isUserAudioPlaying ? (
									<BsPauseFill size={32} />
								) : (
									<BiPlay size={40} />
								)
							) : (
								<BsFillMicFill size={32} />
							)}
						</button>

						{/* Speaker button (右側) - speech.audioFilePathの再生 */}
						<button
							type="button"
							onClick={handleStartPractice}
							disabled={isStartingPractice}
							className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isStartingPractice ? (
								<AiOutlineLoading3Quarters size={24} className="animate-spin" />
							) : (
								<RiSpeakLine size={24} />
							)}
						</button>
					</div>
				</div>
			)}

			{/* ステータス変更モーダル */}
			<SpeechStatusModal
				isOpen={isStatusModalOpen}
				onClose={() => setIsStatusModalOpen(false)}
				statuses={statuses}
				currentStatusId={speech.status.id}
				onStatusChange={handleStatusChange}
				isLoading={isLoadingStatuses}
			/>

			{/* Help Modal */}
			<SpeechReviewHelpModal
				isOpen={showHelpModal}
				onClose={() => setShowHelpModal(false)}
			/>
		</div>
	);
}
