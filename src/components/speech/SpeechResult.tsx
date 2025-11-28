import { useState, useRef, useEffect } from "react";
import { AiOutlineCaretRight } from "react-icons/ai";
import { BsPauseFill } from "react-icons/bs";

interface Sentence {
	learningLanguage: string;
	nativeLanguage: string;
}

interface FeedbackItem {
	category: string;
	content: string;
}

interface SpeechResultProps {
	title: string;
	speechPlan: string[];
	yourSpeech: string;
	sentences: Sentence[];
	feedback: FeedbackItem[];
	audioBlob?: Blob | null;
	onSave?: () => void;
}

export default function SpeechResult({
	title,
	speechPlan,
	yourSpeech,
	sentences,
	feedback,
	audioBlob,
	onSave,
}: SpeechResultProps) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [editableSentences, setEditableSentences] =
		useState<Sentence[]>(sentences);
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

	return (
		<div className="max-w-4xl mx-auto">
			{/* Header */}
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-xl md:text-2xl font-bold text-gray-900">
					Add Speech
				</h2>
				<div className="text-sm text-gray-600">Left: 1 / 1</div>
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
				<h2 className="text-xl font-semibold text-gray-900 mb-4">
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
								className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
							>
								{isPlaying ? (
									<BsPauseFill size={20} className="text-gray-600" />
								) : (
									<div className="w-0 h-0 border-t-6 border-t-transparent border-l-8 border-l-gray-600 border-b-6 border-b-transparent ml-1" />
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
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						AI Suggested Sentences
					</h3>
					<div className="space-y-6">
						{editableSentences.map((sentence, index) => (
							<div key={index}>
								{/* Header */}
								<div className="flex items-center mb-3">
									<AiOutlineCaretRight
										size={16}
										className="text-gray-600 mr-1"
									/>
									<span className="font-medium text-gray-900 text-md">
										Sentence {index + 1}
									</span>
								</div>

								{/* Learning Language */}
								<textarea
									value={sentence.learningLanguage}
									onChange={(e) =>
										handleSentenceChange(
											index,
											"learningLanguage",
											e.target.value,
										)
									}
									className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 mb-2"
									rows={3}
								/>

								{/* Native Language */}
								<textarea
									value={sentence.nativeLanguage}
									onChange={(e) =>
										handleSentenceChange(
											index,
											"nativeLanguage",
											e.target.value,
										)
									}
									className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-gray-50"
									rows={2}
								/>
							</div>
						))}
					</div>
				</div>

				{/* Feedback */}
				<div className="mb-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-2">Feedback</h3>
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

			{/* Save Button */}
			<button
				type="button"
				onClick={onSave}
				className="w-full text-white rounded-md font-semibold py-4 transition-colors"
				style={{ backgroundColor: "#616161" }}
				onMouseEnter={(e) => {
					e.currentTarget.style.backgroundColor = "#525252";
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.backgroundColor = "#616161";
				}}
			>
				Save
			</button>
		</div>
	);
}
