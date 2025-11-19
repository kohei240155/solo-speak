import { SavedPhrase, PhraseData } from "@/types/phrase";
import { LanguageInfo } from "@/types/common";
import { SpeakConfig } from "@/types/speak";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/ui/useTranslation";
import LoadingSpinner from "../common/LoadingSpinner";
import PhraseItem from "./PhraseItem";
import EditPhraseModal from "./EditPhraseModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import ExplanationModal from "./ExplanationModal";
import SpeakModeModal from "../modals/SpeakModeModal";

interface PhraseListProps {
	isModalContext?: boolean;
	nativeLanguage?: string;
	learningLanguage?: string;
	targetUserId?: string | null;
	savedPhrases?: PhraseData[];
	isLoadingPhrases?: boolean;
	isLoadingMore?: boolean;
	languages?: LanguageInfo[];
	showSpeakModal?: boolean;
	onSpeakModalStateChange?: (state: boolean) => void;
	onRefreshPhrases?: () => void;
	onUpdatePhrase?: (phrase: PhraseData) => void;
}

export default function PhraseList({
	nativeLanguage = "",
	learningLanguage,
	onUpdatePhrase,
	onRefreshPhrases,
	showSpeakModal: externalShowSpeakModal = false,
	onSpeakModalStateChange,
	savedPhrases = [],
	isLoadingPhrases = false,
	isLoadingMore = false,
	languages = [],
}: PhraseListProps) {
	const { t } = useTranslation("common");
	const router = useRouter();

	// ローカル状態管理
	const [openMenuId, setOpenMenuId] = useState<string | null>(null);
	const [editingPhrase, setEditingPhrase] = useState<SavedPhrase | null>(null);
	const [deletingPhraseId, setDeletingPhraseId] = useState<string | null>(null);
	const [explanationPhrase, setExplanationPhrase] =
		useState<SavedPhrase | null>(null);
	const [showLocalSpeakModal, setShowLocalSpeakModal] = useState(false);

	const handleMenuToggle = useCallback(
		(phraseId: string) => {
			if (phraseId === "") {
				setOpenMenuId(null);
			} else {
				setOpenMenuId(openMenuId === phraseId ? null : phraseId);
			}
		},
		[openMenuId],
	);

	const handleEdit = useCallback((phrase: SavedPhrase) => {
		setEditingPhrase(phrase);
		setOpenMenuId(null);
	}, []);

	const handleSpeak = useCallback(
		(phraseId: string) => {
			// 特定のフレーズを練習するために、そのフレーズIDをパラメータとして遷移
			router.push(`/phrase/speak?phraseId=${phraseId}`);
			setOpenMenuId(null);
		},
		[router],
	);

	const handleDelete = useCallback((phraseId: string) => {
		setDeletingPhraseId(phraseId);
		setOpenMenuId(null);
	}, []);

	const handleExplanation = useCallback((phrase: SavedPhrase) => {
		setExplanationPhrase(phrase);
		setOpenMenuId(null);
	}, []);

	const handleSpeakStart = (config: SpeakConfig) => {
		// 設定に基づいてSpeak画面に遷移
		const queryParams = new URLSearchParams({
			language: config.language,
			excludeTodayPracticed: (config.excludeTodayPracticed ?? true).toString(),
		});

		// excludeIfSpeakCountGTEパラメータを追加（undefinedでない場合のみ）
		if (config.excludeIfSpeakCountGTE !== undefined) {
			queryParams.set(
				"excludeIfSpeakCountGTE",
				config.excludeIfSpeakCountGTE.toString(),
			);
		}

		router.push(`/phrase/speak?${queryParams.toString()}`);
	};

	const handleSpeakModalClose = () => {
		setShowLocalSpeakModal(false);
		if (onSpeakModalStateChange) {
			onSpeakModalStateChange(false);
		}
	};

	const handleEditClose = () => {
		setEditingPhrase(null);
	};

	const handleDeleteClose = () => {
		setDeletingPhraseId(null);
	};

	const handleExplanationClose = () => {
		setExplanationPhrase(null);
	};

	const handlePhraseUpdate = useCallback(
		(updatedPhrase: SavedPhrase) => {
			if (onUpdatePhrase) {
				onUpdatePhrase(updatedPhrase);
			}
		},
		[onUpdatePhrase],
	);

	if (isLoadingPhrases && savedPhrases.length === 0) {
		return (
			<div className="pt-20">
				<LoadingSpinner message="Loading phrases..." />
			</div>
		);
	}

	if (savedPhrases.length === 0) {
		return (
			<div className="text-center py-8">
				<p className="text-gray-600">{t("phrase.noPhrasesYet")}</p>
			</div>
		);
	}

	return (
		<>
			<div className="space-y-4 pb-32">
				{savedPhrases.map((phrase, index) => (
					<PhraseItem
						key={`${phrase.id}-${index}`}
						phrase={phrase}
						isMenuOpen={openMenuId === phrase.id}
						onMenuToggle={handleMenuToggle}
						onEdit={handleEdit}
						onSpeak={handleSpeak}
						onDelete={handleDelete}
						onExplanation={handleExplanation}
					/>
				))}

				{/* 無限スクロール用のローディング */}
				{isLoadingMore && (
					<div className="flex justify-center py-4">
						<div className="flex items-center text-gray-500">
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
							<span className="text-sm">Loading more...</span>
						</div>
					</div>
				)}
			</div>

			{/* 編集モーダル */}
			<EditPhraseModal
				isOpen={!!editingPhrase}
				phrase={editingPhrase}
				languages={languages}
				nativeLanguage={nativeLanguage}
				onClose={handleEditClose}
				onUpdate={handlePhraseUpdate}
				onRefresh={onRefreshPhrases}
			/>

			{/* 削除確認モーダル */}
			<DeleteConfirmationModal
				isOpen={!!deletingPhraseId}
				phraseId={deletingPhraseId}
				onClose={handleDeleteClose}
				onRefresh={onRefreshPhrases}
			/>

			{/* Explanation モーダル */}
			<ExplanationModal
				isOpen={!!explanationPhrase}
				phrase={explanationPhrase}
				onClose={handleExplanationClose}
			/>

			{/* Speak Mode モーダル（外部管理でない場合のみ表示） */}
			{!externalShowSpeakModal && (
				<SpeakModeModal
					isOpen={showLocalSpeakModal}
					onClose={handleSpeakModalClose}
					onStart={handleSpeakStart}
					languages={languages}
					defaultLearningLanguage={learningLanguage}
				/>
			)}

			{/* メニューが開いている時のオーバーレイ */}
			{openMenuId && (
				<div
					className="fixed inset-0 z-0"
					onClick={() => setOpenMenuId(null)}
				/>
			)}
		</>
	);
}
