import { useState, useEffect } from "react";
import BaseModal from "../common/BaseModal";
import LoadingSpinner from "../common/LoadingSpinner";
import AnimatedButton from "../common/AnimatedButton";
import { api } from "@/utils/api";
import { useScrollPreservation } from "@/hooks/ui/useScrollPreservation";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { RiDeleteBin6Line } from "react-icons/ri";
import { GoTriangleRight } from "react-icons/go";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SpeechReviewResponseData } from "@/types/speech";

interface EditSpeechModalProps {
	isOpen: boolean;
	speechId: string | null;
	onClose: () => void;
	onRefresh?: () => void;
}

const editSpeechFormSchema = z.object({
	title: z.string().max(50),
	sentences: z.array(
		z.object({
			learningLanguage: z.string().max(500),
			nativeLanguage: z.string().max(500),
		}),
	),
});

type EditSpeechFormData = z.infer<typeof editSpeechFormSchema>;

interface SpeechDetail {
	id: string;
	title: string;
	phrases: Array<{
		id: string;
		original: string;
		translation: string;
		speechOrder: number;
	}>;
}

export default function EditSpeechModal({
	isOpen,
	speechId,
	onClose,
	onRefresh,
}: EditSpeechModalProps) {
	const { session } = useAuth();
	const scrollPreservation = useScrollPreservation();
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [speech, setSpeech] = useState<SpeechDetail | null>(null);

	const {
		register,
		control,
		formState: { errors },
		watch,
		reset,
	} = useForm<EditSpeechFormData>({
		resolver: zodResolver(editSpeechFormSchema),
		mode: "onChange",
		defaultValues: {
			title: "",
			sentences: [],
		},
	});

	const { fields, remove } = useFieldArray({
		control,
		name: "sentences",
	});

	const titleValue = watch("title");
	const sentencesValue = watch("sentences");

	// バリデーションエラーがあるかチェック
	const hasValidationErrors =
		Object.keys(errors).length > 0 ||
		!titleValue ||
		titleValue.trim() === "" ||
		(titleValue && titleValue.length > 50) ||
		sentencesValue?.some(
			(item) =>
				(item.learningLanguage && item.learningLanguage.length > 500) ||
				(item.nativeLanguage && item.nativeLanguage.length > 500),
		);

	// スピーチ詳細を取得
	useEffect(() => {
		if (isOpen && speechId && session) {
			setIsLoading(true);
			api
				.get(`/api/speech/${speechId}`)
				.then((data) => {
					const responseData = data as SpeechReviewResponseData;
					if (responseData.speech) {
						const speechData = responseData.speech;
						setSpeech(speechData);
						// フォームを初期化
						reset({
							title: speechData.title,
							sentences: speechData.phrases
								.sort((a, b) => a.speechOrder - b.speechOrder)
								.map((phrase) => ({
									learningLanguage: phrase.original,
									nativeLanguage: phrase.translation,
								})),
						});
					}
				})
				.catch((error) => {
					console.error("Failed to fetch speech:", error);
					toast.error("Failed to load speech");
					onClose();
				})
				.finally(() => {
					setIsLoading(false);
				});
		}
	}, [isOpen, speechId, session, onClose, reset]);

	// フォームの値が変更されたら、すべてのtextareaの高さを調整
	useEffect(() => {
		if (!isLoading) {
			// 次のレンダリングサイクルで実行
			setTimeout(() => {
				const textareas =
					document.querySelectorAll<HTMLTextAreaElement>("textarea");
				textareas.forEach((textarea) => {
					textarea.style.height = "auto";
					textarea.style.height = `${textarea.scrollHeight}px`;
				});
			}, 0);
		}
	}, [isLoading, titleValue, sentencesValue]);

	const handleSave = async () => {
		if (!speechId || !session || hasValidationErrors) return;

		setIsSaving(true);
		try {
			await api.put(`/api/speech/${speechId}`, {
				title: titleValue.trim(),
				phrases: sentencesValue.map((sentence, index) => ({
					phraseId: speech?.phrases[index]?.id,
					original: sentence.learningLanguage.trim(),
					translation: sentence.nativeLanguage.trim(),
				})),
			});

			toast.success("Speech updated successfully!");
			onClose();

			// リストを更新
			if (onRefresh) {
				onRefresh();
			}
		} catch (error) {
			console.error("Failed to update speech:", error);
			toast.error("Failed to update speech");
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancel = () => {
		reset();
		setSpeech(null);
		onClose();
	};

	const handleDeleteSentence = (index: number) => {
		if (fields.length > 1) {
			remove(index);
		}
	};

	return (
		<BaseModal
			isOpen={isOpen}
			onClose={handleCancel}
			title="Edit Speech"
			width="600px"
		>
			{isLoading ? (
				<LoadingSpinner
					size="md"
					message="Loading speech..."
					className="py-8"
				/>
			) : (
				<>
					{/* Title */}
					<div className="mb-4">
						<h3 className="text-xl font-semibold text-gray-900 mb-2">Title</h3>
						<textarea
							{...register("title")}
							onInput={(e) => {
								const target = e.target as HTMLTextAreaElement;
								target.style.height = "auto";
								target.style.height = `${target.scrollHeight}px`;
							}}
							onFocus={scrollPreservation.onFocus}
							onBlur={scrollPreservation.onBlur}
							className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm focus:outline-none text-gray-900 placeholder-gray-300 resize-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 overflow-hidden"
							rows={1}
							disabled={isSaving}
						/>
						{errors.title && (
							<p className="text-red-500 text-xs mt-1">
								タイトルは50文字以内で入力してください
							</p>
						)}
					</div>

					{/* Sentences */}
					<div className="mb-6 max-h-[400px] overflow-y-auto scrollbar-hide">
						{fields.map((field, index) => (
							<div key={field.id} className="mb-4">
								<div className="flex items-center justify-between mb-2">
									<h3 className="text-lg font-semibold text-gray-900 flex items-center gap-1">
										<GoTriangleRight className="text-2xl" />
										<span>Sentence{index + 1}</span>
									</h3>
									<button
										type="button"
										className={`${fields.length === 1 || isSaving ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:text-gray-800"}`}
										onClick={() => handleDeleteSentence(index)}
										disabled={fields.length === 1 || isSaving}
									>
										<RiDeleteBin6Line size={20} />
									</button>
								</div>
								<div className="space-y-2">
									<textarea
										{...register(`sentences.${index}.learningLanguage`)}
										onInput={(e) => {
											const target = e.target as HTMLTextAreaElement;
											target.style.height = "auto";
											target.style.height = `${target.scrollHeight}px`;
										}}
										onFocus={scrollPreservation.onFocus}
										onBlur={scrollPreservation.onBlur}
										className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm focus:outline-none text-gray-900 placeholder-gray-300 resize-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 overflow-hidden"
										rows={1}
										disabled={isSaving}
									/>
									<textarea
										{...register(`sentences.${index}.nativeLanguage`)}
										onInput={(e) => {
											const target = e.target as HTMLTextAreaElement;
											target.style.height = "auto";
											target.style.height = `${target.scrollHeight}px`;
										}}
										onFocus={scrollPreservation.onFocus}
										onBlur={scrollPreservation.onBlur}
										className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm focus:outline-none text-gray-900 placeholder-gray-300 resize-none disabled:opacity-50 disabled:cursor-not-allowed bg-gray-50 overflow-hidden"
										rows={1}
										disabled={isSaving}
									/>
								</div>
								{(errors.sentences?.[index]?.learningLanguage ||
									errors.sentences?.[index]?.nativeLanguage) && (
									<p className="text-red-500 text-xs mt-1">
										各文は500文字以内で入力してください
									</p>
								)}
							</div>
						))}
					</div>

					{/* ボタン */}
					<div className="flex gap-3 sticky bottom-0 bg-white pt-4">
						<AnimatedButton
							onClick={handleCancel}
							disabled={isSaving}
							variant="secondary"
						>
							Cancel
						</AnimatedButton>
						<AnimatedButton
							onClick={handleSave}
							disabled={hasValidationErrors}
							isLoading={isSaving}
							variant="primary"
						>
							Save
						</AnimatedButton>
					</div>
				</>
			)}
		</BaseModal>
	);
}
