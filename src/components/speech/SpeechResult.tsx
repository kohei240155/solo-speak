import { useState, useRef, useEffect } from "react";
import { AiOutlineCaretRight } from "react-icons/ai";
import { BsPauseFill } from "react-icons/bs";
import { GrPowerReset } from "react-icons/gr";
import { RiDeleteBin6Line } from "react-icons/ri";
import AnimatedButton from "../common/AnimatedButton";
import { SentenceData, FeedbackData } from "@/types/speech";

interface SpeechResultProps {
	title: string;
	speechPlan: string[];
	yourSpeech: string;
	sentences: SentenceData[];
	feedback: FeedbackData[];
	audioBlob?: Blob | null;
	note?: string;
	onNoteChange?: (note: string) => void;
	onSave?: () => void | Promise<void>;
	isSaving?: boolean;
}

export default function SpeechResult({
	title,
	speechPlan,
	yourSpeech,
	sentences,
	feedback,
	audioBlob,
	onSave,
	isSaving = false,
	note = "",
	onNoteChange,
}: SpeechResultProps) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [editableSentences, setEditableSentences] =
		useState<SentenceData[]>(sentences);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	// 音声再生/一時停止
	const handlePlayAudio = () => {
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

	// 文章の編集ハンドラ
	const handleSentenceChange = (
		index: number,
		field: "learningLanguage" | "nativeLanguage",
		value: string,
	) => {
		const newSentences = [...editableSentences];
		newSentences[index] = {
			...newSentences[index],
			[field]: value,
		};
		setEditableSentences(newSentences);
	};

	// センテンスをリセット
	const handleResetSentences = () => {
		setEditableSentences(sentences);
	};

	// センテンスを削除
	const handleDeleteSentence = (index: number) => {
		const newSentences = editableSentences.filter((_, i) => i !== index);
		setEditableSentences(newSentences);
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

	// sentencesが変更されたら同期
	useEffect(() => {
		setEditableSentences(sentences);
	}, [sentences]);

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
	}, [editableSentences, note]);

	// 保存ボタンのハンドラー
	const handleSaveClick = async () => {
		if (onSave) {
			await onSave();
		}
	};

	return (
		<div className="max-w-4xl mx-auto">
			{/* Header */}
			<div className="mb-6">
				<h2 className="text-xl md:text-2xl font-bold text-gray-900">
					Add Speech
				</h2>
			</div>

			{/* Title */}
			<div className="mb-4">
				<h2 className="text-xl font-semibold text-gray-900 mb-2">Title</h2>
				<div className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm text-gray-900 bg-gray-50">
					{title}
				</div>
			</div>

			{/* Speech Plan */}
			<div className="mb-6">
				<h2 className="text-xl font-semibold text-gray-900 mb-2">
					Speech Plan
				</h2>
				<div className="space-y-2">
					{speechPlan.map((item, index) => (
						<div
							key={index}
							className="border border-gray-300 rounded-md px-3 py-3 text-sm text-gray-900 bg-gray-50"
						>
							{item}
						</div>
					))}
				</div>
			</div>

			{/* Speech Result Section */}
			<div className="mb-6">
				<h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
					Speech Result
				</h2>

				{/* Your Speech */}
				<div className="mb-4">
					<div className="flex justify-between items-center mb-2">
						<h3 className="text-lg font-semibold text-gray-900">Your Speech</h3>
						{audioBlob && (
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
					<div className="border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-900 bg-white whitespace-pre-wrap">
						{yourSpeech}
					</div>
				</div>

				{/* AI Suggested Sentences */}
				<div className="mb-4">
					<div className="flex justify-between items-center mb-2">
						<h3 className="text-lg font-semibold text-gray-900">
							AI Suggested Sentences
						</h3>
						<button
							type="button"
							onClick={handleResetSentences}
							className="p-2 rounded-full hover:bg-gray-100 transition-colors"
							title="Reset to original sentences"
						>
							<GrPowerReset size={20} className="text-gray-600" />
						</button>
					</div>
					<div className="space-y-6">
						{editableSentences.map((sentence, index) => (
							<div key={index}>
								{/* Header */}
								<div className="flex items-center justify-between mb-1">
									<div className="flex items-center">
										<AiOutlineCaretRight
											size={16}
											className="text-gray-600 mr-1"
										/>
										<span className="font-medium text-gray-900 text-md">
											Sentence {index + 1}
										</span>
									</div>
									<button
										type="button"
										onClick={() => handleDeleteSentence(index)}
										disabled={editableSentences.length === 1}
										className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
										title="Delete this sentence"
									>
										<RiDeleteBin6Line size={20} className="text-gray-600" />
									</button>
								</div>

								{/* Learning Language */}
								<textarea
									value={sentence.learningLanguage}
									onChange={(e) => {
										handleSentenceChange(
											index,
											"learningLanguage",
											e.target.value,
										);
									}}
									onInput={(e) => {
										const target = e.target as HTMLTextAreaElement;
										target.style.height = "auto";
										target.style.height = `${target.scrollHeight}px`;
									}}
									className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 mb-2 overflow-hidden"
									rows={1}
								/>

								{/* Native Language */}
								<textarea
									value={sentence.nativeLanguage}
									onChange={(e) => {
										handleSentenceChange(
											index,
											"nativeLanguage",
											e.target.value,
										);
									}}
									onInput={(e) => {
										const target = e.target as HTMLTextAreaElement;
										target.style.height = "auto";
										target.style.height = `${target.scrollHeight}px`;
									}}
									className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-gray-50 overflow-hidden"
									rows={1}
								/>
							</div>
						))}
					</div>
				</div>

				{/* Feedback */}
				<div className="mb-6">
					<h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2">
						Feedback
					</h3>
					<div className="space-y-6">
						{feedback.map((item, index) => (
							<div key={index}>
								{/* Header */}
								<div className="flex items-center mb-3">
									<AiOutlineCaretRight
										size={16}
										className="text-gray-600 mr-1"
									/>
									<span className="font-medium text-gray-900 text-md">
										{item.category}
									</span>
								</div>

								{/* Content */}
								<div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
									<p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
										{item.content}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Note */}
			<div className="mb-6">
				<h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2">
					Note
				</h3>
				<textarea
					value={note}
					onChange={(e) => onNoteChange?.(e.target.value)}
					onInput={(e) => {
						const target = e.target as HTMLTextAreaElement;
						target.style.height = "auto";
						target.style.height = `${target.scrollHeight}px`;
					}}
					placeholder="気づいたことを自由にメモしましょう。"
					className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 overflow-hidden"
					rows={4}
				/>
			</div>

			{/* Save Button */}
			<AnimatedButton
				onClick={handleSaveClick}
				variant="primary"
				disabled={isSaving}
			>
				{isSaving ? "Saving..." : "Save"}
			</AnimatedButton>
		</div>
	);
}
