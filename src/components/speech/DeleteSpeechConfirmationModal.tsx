import { useState } from "react";
import BaseModal from "../common/BaseModal";
import { api } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

interface DeleteSpeechConfirmationModalProps {
	isOpen: boolean;
	speechId: string | null;
	onClose: () => void;
	onRefresh?: () => void;
}

export default function DeleteSpeechConfirmationModal({
	isOpen,
	speechId,
	onClose,
	onRefresh,
}: DeleteSpeechConfirmationModalProps) {
	const { session } = useAuth();
	const [isDeleting, setIsDeleting] = useState(false);

	const handleConfirmDelete = async () => {
		if (!speechId || !session) return;

		setIsDeleting(true);
		try {
			await api.delete(`/api/speech/${speechId}`);

			onClose();

			// リストを更新
			if (onRefresh) {
				onRefresh();
			}

			// 成功トースト表示
			toast.success("Speech deleted successfully!");
		} catch {
			toast.error("Failed to delete speech");
		} finally {
			setIsDeleting(false);
		}
	};

	const handleCancel = () => {
		setIsDeleting(false);
		onClose();
	};

	return (
		<BaseModal isOpen={isOpen} onClose={handleCancel} title="Delete Speech">
			{/* 確認メッセージ */}
			<div className="mb-6">
				<p className="text-gray-700">
					Are you sure you want to delete this speech?
					<br />
					This action cannot be undone.
				</p>
			</div>

			{/* ボタン */}
			<div className="flex gap-3">
				<button
					onClick={handleCancel}
					disabled={isDeleting}
					className="flex-1 bg-white border py-2 px-4 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed"
					style={{
						borderColor: "#616161",
						color: "#616161",
					}}
				>
					Cancel
				</button>
				<button
					onClick={handleConfirmDelete}
					disabled={isDeleting}
					className="flex-1 text-white py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed"
					style={{
						backgroundColor: isDeleting ? "#FCA5A5" : "#DC2626",
					}}
				>
					{isDeleting ? (
						<div className="flex items-center justify-center">
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
							Deleting...
						</div>
					) : (
						"Delete"
					)}
				</button>
			</div>
		</BaseModal>
	);
}
