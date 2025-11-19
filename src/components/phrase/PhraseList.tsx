import { SavedPhrase, PhraseData } from "@/types/phrase";
import { LanguageInfo } from "@/types/common";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/ui/useTranslation";
import LoadingSpinner from "../common/LoadingSpinner";
import PhraseItem from "./PhraseItem";
import EditPhraseModal from "./EditPhraseModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import ExplanationModal from "./ExplanationModal";

interface PhraseListProps {
	isModalContext?: boolean;
	nativeLanguage?: string;
	learningLanguage?: string;
	targetUserId?: string | null;
	savedPhrases?: PhraseData[];
	isLoadingPhrases?: boolean;
	isLoadingMore?: boolean;
	languages?: LanguageInfo[];
	onRefreshPhrases?: () => void;
	onUpdatePhrase?: (phrase: PhraseData) => void;
}

export default function PhraseList({
	nativeLanguage = "",
	onUpdatePhrase,
	onRefreshPhrases,
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
					<div className="py-4">
						<LoadingSpinner />
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
