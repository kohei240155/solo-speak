import { SpeechListItem } from "@/types/speech";
import { useCallback, useState } from "react";
import LoadingSpinner from "../common/LoadingSpinner";
import SpeechItem from "./SpeechItem";
import EditSpeechModal from "./EditSpeechModal";
import DeleteSpeechConfirmationModal from "./DeleteSpeechConfirmationModal";

interface SpeechListProps {
	speeches?: SpeechListItem[];
	isLoadingSpeeches?: boolean;
	isLoadingMore?: boolean;
	learningLanguage?: string;
	onRefreshSpeeches?: () => void;
}

export default function SpeechList({
	speeches = [],
	isLoadingSpeeches = false,
	isLoadingMore = false,
	learningLanguage,
	onRefreshSpeeches,
}: SpeechListProps) {
	const [openMenuId, setOpenMenuId] = useState<string | null>(null);
	const [editingSpeech, setEditingSpeech] = useState<SpeechListItem | null>(
		null,
	);
	const [deletingSpeechId, setDeletingSpeechId] = useState<string | null>(null);

	const handleSpeechClick = useCallback((speechId: string) => {
		// スピーチ詳細ページへ遷移 (実装予定)
		console.log("Speech clicked:", speechId);
		// router.push(`/speech/${speechId}`);
	}, []);

	const handleMenuToggle = useCallback(
		(speechId: string) => {
			if (speechId === "") {
				setOpenMenuId(null);
			} else {
				setOpenMenuId(openMenuId === speechId ? null : speechId);
			}
		},
		[openMenuId],
	);

	const handleEdit = useCallback((speech: SpeechListItem) => {
		setEditingSpeech(speech);
		setOpenMenuId(null);
	}, []);

	const handleDelete = useCallback((speechId: string) => {
		setDeletingSpeechId(speechId);
		setOpenMenuId(null);
	}, []);

	const handleEditClose = () => {
		setEditingSpeech(null);
	};

	const handleDeleteClose = () => {
		setDeletingSpeechId(null);
	};

	if (!learningLanguage || isLoadingSpeeches) {
		return (
			<div className="pt-20">
				<LoadingSpinner message="Loading speeches..." />
			</div>
		);
	}

	if (speeches.length === 0) {
		return (
			<div className="text-center py-8">
				<p className="text-gray-600">No speeches yet.</p>
			</div>
		);
	}

	return (
		<>
			<div className="space-y-4 pb-32">
				{speeches.map((speech, index) => (
					<SpeechItem
						key={`${speech.id}-${index}`}
						speech={speech}
						isMenuOpen={openMenuId === speech.id}
						onMenuToggle={handleMenuToggle}
						onSpeechClick={handleSpeechClick}
						onEdit={handleEdit}
						onDelete={handleDelete}
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
			<EditSpeechModal
				isOpen={!!editingSpeech}
				speechId={editingSpeech?.id || null}
				onClose={handleEditClose}
				onRefresh={onRefreshSpeeches}
			/>

			{/* 削除確認モーダル */}
			<DeleteSpeechConfirmationModal
				isOpen={!!deletingSpeechId}
				speechId={deletingSpeechId}
				onClose={handleDeleteClose}
				onRefresh={onRefreshSpeeches}
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
