import { useState, useRef, useEffect } from "react";
import { AiOutlineCaretRight } from "react-icons/ai";
import { BsPauseFill } from "react-icons/bs";
import { SpeechReviewResponseData } from "@/types/speech";

interface SpeechReviewProps {
	speech: NonNullable<SpeechReviewResponseData["speech"]>;
}

export default function SpeechReview({ speech }: SpeechReviewProps) {
	const [activeTab, setActiveTab] = useState<"Script" | "Feedback" | "Note">(
		"Script",
	);
	const [isPlaying, setIsPlaying] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);

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

	// クリーンアップ
	useEffect(() => {
		return () => {
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current = null;
			}
		};
	}, []);

	return (
		<div className="max-w-4xl mx-auto">
			{/* Header with checkmark, practice count, and fullscreen */}
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-2xl font-bold text-gray-900">Review Speech</h1>
				<div className="flex items-center gap-4">
					{/* Practice count */}
					<div className="flex items-center gap-2">
						<div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded">
							<span className="text-xs">✓</span>
						</div>
						<span className="text-sm font-medium">{speech.practiceCount}</span>
					</div>
					{/* Fullscreen icon placeholder */}
					<button
						type="button"
						className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
					>
						<span className="text-xl">⛶</span>
					</button>
					{/* Font size icon placeholder */}
					<button
						type="button"
						className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
					>
						<span className="text-sm font-bold">A</span>
					</button>
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
					<div>
						<h3 className="text-lg font-semibold text-gray-900 mb-3">
							English
						</h3>
						<div className="border border-gray-300 rounded-lg p-4 bg-white space-y-4">
							{speech.phrases.map((phrase) => (
								<p key={phrase.id} className="text-base text-gray-900">
									{phrase.original}
								</p>
							))}
						</div>
					</div>
				)}

				{activeTab === "Feedback" && (
					<div className="space-y-4">
						{speech.feedbacks.length > 0 ? (
							speech.feedbacks.map((feedback) => (
								<div
									key={feedback.id}
									className="border border-gray-300 rounded-lg p-4 bg-white"
								>
									<div className="font-semibold text-gray-900 mb-2">
										{feedback.category}
									</div>
									<div className="text-sm text-gray-700">
										{feedback.content}
									</div>
								</div>
							))
						) : (
							<div className="text-center py-8 text-gray-500">
								No feedback available
							</div>
						)}
					</div>
				)}

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
			<div className="flex flex-col items-center gap-4 py-6">
				<div className="text-2xl font-medium text-gray-900">0:30</div>
				<div className="flex items-center gap-6">
					{/* Analytics button */}
					<button
						type="button"
						className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-gray-300 hover:bg-gray-50 transition-colors"
					>
						<svg
							className="w-6 h-6 text-gray-700"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
					</button>

					{/* Play/Pause button */}
					<button
						type="button"
						onClick={handlePlayAudio}
						disabled={!speech.audioFilePath}
						className="w-20 h-20 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-800 disabled:bg-gray-300 transition-colors"
					>
						{isPlaying ? (
							<BsPauseFill className="text-white text-3xl" />
						) : (
							<AiOutlineCaretRight className="text-white text-3xl ml-1" />
						)}
					</button>

					{/* Headphones button */}
					<button
						type="button"
						className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-gray-300 hover:bg-gray-50 transition-colors"
					>
						<svg
							className="w-6 h-6 text-gray-700"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	);
}
