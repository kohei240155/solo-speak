"use client";

import { useState } from "react";
import { useTranslation } from "@/hooks/ui/useTranslation";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WithdrawalModal({
  isOpen,
  onClose,
}: WithdrawalModalProps) {
  const { t } = useTranslation();
  const { signOut, userSettings } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (isDeleting) return;

    // メールアドレスの確認
    const registeredEmail = userSettings?.email;
    if (!registeredEmail) {
      setEmailError(t("settings.withdrawal.emailNotFound"));
      return;
    }

    if (emailInput.trim() !== registeredEmail.trim()) {
      setEmailError(t("settings.withdrawal.emailMismatch"));
      return;
    }

    setEmailError("");
    setIsDeleting(true);

    try {
      await api.delete("/api/user/withdrawal");

      toast.success(t("settings.withdrawal.success"));

      // ログアウト処理を実行
      await signOut();
    } catch (error) {
      console.error("Account deletion failed:", error);
      toast.error(t("settings.withdrawal.error"));
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  const handleClose = () => {
    setEmailInput("");
    setEmailError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {t("settings.withdrawal.title")}
        </h2>

        <div className="text-gray-700 mb-6 whitespace-pre-line text-sm leading-relaxed">
          {t("settings.withdrawal.message")}
        </div>

        {/* Email confirmation */}
        <div className="mb-4">
          <label
            htmlFor="email-confirm"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {t("settings.withdrawal.emailConfirmLabel")}
          </label>
          <input
            type="email"
            id="email-confirm"
            value={emailInput}
            onChange={(e) => {
              setEmailInput(e.target.value);
              if (emailError) setEmailError("");
            }}
            placeholder={t("settings.withdrawal.emailPlaceholder")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            disabled={isDeleting}
          />
          {emailError && (
            <p className="mt-1 text-sm text-red-600">{emailError}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t("settings.withdrawal.cancelButton")}
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting || !emailInput.trim()}
            className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isDeleting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {t("settings.withdrawal.confirmButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
