import { useState, useRef, useEffect } from "react";
import { AiOutlineLineChart, AiOutlineCaretRight } from "react-icons/ai";
import { BsPauseFill, BsFillMicFill } from "react-icons/bs";
import { BiPlay, BiStop } from "react-icons/bi";
import { IoCheckboxOutline } from "react-icons/io5";
import { GiChart } from "react-icons/gi";
import { RiSpeakLine } from "react-icons/ri";
import { SpeechReviewResponseData } from "@/types/speech";
import toast from "react-hot-toast";
import SpeechStatusModal, {
	SpeechStatus,
} from "@/components/modals/SpeechStatusModal";
import { api } from "@/utils/api";

interface SpeechReviewProps {
	speech: NonNullable<SpeechReviewResponseData["speech"]>;
}

export default function SpeechReview({ speech }: SpeechReviewProps) {
	const [activeTab, setActiveTab] = useState<"Script" | "Feedback" | "Note">(
		"Script",
	);
	const [isPlaying, setIsPlaying] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	// ステータス変更モーダルの状態
	const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
	const [statuses, setStatuses] = useState<SpeechStatus[]>([]);
	const [currentStatus, setCurrentStatus] = useState(speech.status);
	const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);

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
	const handlePlayAudio = () => {
		if (!speech.audioFilePath) return;

		if (!audioRef.current) {
			const audio = new Audio(speech.audioFilePath);
			audioRef.current = audio;

			audio.onended = () => {
				setIsPlaying(false);
			};

			audio.onerror = () => {
				setIsPlaying(false);
				console.error("Failed to load audio");
			};
		}

		if (isPlaying) {
			audioRef.current.pause();
			setIsPlaying(false);
		} else {
			audioRef.current.play().catch((error) => {
				console.error("Failed to play audio:", error);
				setIsPlaying(false);
			});
			setIsPlaying(true);
		}
	};

	// ユーザー録音の開始
	const startUserRecording = async () => {
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
				// 録音時間をチェック
				const recordingDuration = recordingStartTimeRef.current
					? (Date.now() - recordingStartTimeRef.current) / 1000
					: 0;

				// 10秒以上の場合のみBlobを保存
				if (recordingDuration >= 10) {
					const blob = new Blob(chunks, { type: "audio/webm" });
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
		} catch (error) {
			console.error("Failed to start recording:", error);
			alert("マイクへのアクセスが許可されていません");
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
				toast.error("録音時間が短すぎます");
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
		}
	};

	// ユーザー録音の再生/一時停止
	const handleUserAudioPlay = () => {
		if (!userAudioBlob) return;

		if (!userAudioRef.current) {
			const audio = new Audio(URL.createObjectURL(userAudioBlob));
			userAudioRef.current = audio;

			audio.onended = () => {
				setIsUserAudioPlaying(false);
				// トーストを表示
				toast.success("Review completed!");
				// 録音データをリセット
				setTimeout(() => {
					if (userAudioRef.current) {
						userAudioRef.current = null;
					}
					setUserAudioBlob(null);
					setRecordingTime(90);
				}, 500);
			};
			audio.onerror = () => {
				setIsUserAudioPlaying(false);
				console.error("Failed to load user audio");
			};
		}

		if (isUserAudioPlaying) {
			userAudioRef.current.pause();
			setIsUserAudioPlaying(false);
		} else {
			userAudioRef.current.play().catch((error) => {
				console.error("Failed to play user audio:", error);
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

	// ステータス一覧を取得
	const fetchStatuses = async () => {
		setIsLoadingStatuses(true);
		try {
			const data = await api.get<{ statuses: SpeechStatus[] }>(
				"/api/speech/statuses",
			);
			setStatuses(data.statuses);
		} catch (error) {
			console.error("Failed to fetch statuses:", error);
			toast.error("Failed to load statuses");
		} finally {
			setIsLoadingStatuses(false);
		}
	};

	// ステータス変更処理
	const handleStatusChange = async (statusId: string) => {
		try {
			const data = await api.put<{
				message: string;
				speech: {
					id: string;
					status: {
						id: string;
						name: string;
						description: string | null;
					};
				};
			}>(`/api/speech/${speech.id}/status`, { statusId });

			setCurrentStatus({
				id: data.speech.status.id,
				name: data.speech.status.name,
				description: data.speech.status.description ?? undefined,
			});
			toast.success("Status updated successfully");
		} catch (error) {
			console.error("Failed to update status:", error);
			toast.error("Failed to update status");
			throw error;
		}
	};

	// ステータスモーダルを開く
	const handleOpenStatusModal = async () => {
		if (statuses.length === 0) {
			await fetchStatuses();
		}
		setIsStatusModalOpen(true);
	};

	return (
		<div className="max-w-4xl mx-auto">
			{/* Header with checkmark, practice count, and fullscreen */}
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-2xl font-bold text-gray-900">Review Speech</h1>
				<div className="flex items-center gap-4">
					{/* Practice count */}
					<div className="flex items-center gap-2">
						<IoCheckboxOutline className="w-5 h-5 text-gray-700" />
						<span className="text-sm font-medium">{speech.practiceCount}</span>
					</div>
					{/* Status */}
					<div className="flex items-center gap-2">
						<GiChart className="w-5 h-5 text-gray-700" />
						<span className="text-sm font-medium">{currentStatus.name}</span>
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
						<div>
							<h3 className="text-lg font-semibold text-gray-900 mb-3">
								{speech.learningLanguage.name}
							</h3>
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
						{/* Your Speech Section */}
						<div>
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-xl font-semibold text-gray-900">
									Your Speech
								</h3>
								{speech.audioFilePath && (
									<button
										type="button"
										onClick={handlePlayAudio}
										className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
									>
										{isPlaying ? (
											<BsPauseFill size={18} className="text-gray-600" />
										) : (
											<div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[7px] border-l-gray-600 border-b-[5px] border-b-transparent ml-1" />
										)}
									</button>
								)}
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
					<div className="border border-gray-300 rounded-lg p-4 bg-white">
						{speech.notes ? (
							<p className="text-base text-gray-900 whitespace-pre-wrap">
								{speech.notes}
							</p>
						) : (
							<p className="text-gray-500 text-center py-8">No notes</p>
						)}
					</div>
				)}
			</div>
			{/* Audio Player */}
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
						className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
					>
						<AiOutlineLineChart size={24} />
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
						onClick={handlePlayAudio}
						disabled={!speech.audioFilePath}
						className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<RiSpeakLine size={24} />
					</button>
				</div>
			</div>

			{/* ステータス変更モーダル */}
			<SpeechStatusModal
				isOpen={isStatusModalOpen}
				onClose={() => setIsStatusModalOpen(false)}
				statuses={statuses}
				currentStatusId={currentStatus.id}
				onStatusChange={handleStatusChange}
				isLoading={isLoadingStatuses}
			/>
		</div>
	);
}
