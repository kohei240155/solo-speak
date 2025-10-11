import { useState } from "react";
import BaseModal from "../common/BaseModal";
import { api } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/ui/useTranslation";
import toast from "react-hot-toast";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  phraseId: string | null;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function DeleteConfirmationModal({
  isOpen,
  phraseId,
  onClose,
  onRefresh,
}: DeleteConfirmationModalProps) {
  const { session } = useAuth();
  const { t } = useTranslation("common");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!phraseId || !session) return;

    setIsDeleting(true);
    try {
      await api.delete(`/api/phrase/${phraseId}`);

      onClose();

      // リストを更新
      if (onRefresh) {
        onRefresh();
      }

      // 成功トースト表示
      toast.success("Phrase deleted successfully!");
    } catch {
      toast.error("Failed to delete phrase");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setIsDeleting(false);
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleCancel} title="Delete Phrase">
      {/* 確認メッセージ */}
      <div className="mb-6">
        <p className="text-gray-700">
          {t("phrase.delete.confirmMessage")}
          <br />
          {t("phrase.delete.warningMessage")}
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
