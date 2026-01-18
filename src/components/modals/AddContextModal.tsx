"use client";

import { useState } from "react";
import BaseModal from "../common/BaseModal";
import PracticeButton from "../common/PracticeButton";
import { useTranslation } from "@/hooks/ui/useTranslation";
import { IoLocationOutline } from "react-icons/io5";

interface AddContextModalProps {
	isOpen: boolean;
	onClose: () => void;
	onAdd: (contextName: string) => void;
}

export default function AddContextModal({
	isOpen,
	onClose,
	onAdd,
}: AddContextModalProps) {
	const { t } = useTranslation("app");
	const [contextName, setContextName] = useState("");

	const handleSubmit = () => {
		if (contextName.trim()) {
			onAdd(contextName.trim());
			setContextName("");
			onClose();
		}
	};

	const handleCancel = () => {
		setContextName("");
		onClose();
	};

	const isValid = contextName.trim() && contextName.length <= 50;

	return (
		<BaseModal
			isOpen={isOpen}
			onClose={handleCancel}
			variant="gray"
			width="480px"
		>
			<div className="bg-white rounded-[20px] p-5 -m-5">
				{/* タイトル */}
				<div className="flex items-center mb-4">
					<IoLocationOutline className="w-6 h-6 text-gray-600 mr-2" />
					<h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t("situation.addModal.title")}</h2>
				</div>

				{/* 説明 */}
				<p className="text-sm text-gray-500 mb-4">
					{t("situation.addModal.description")}
				</p>

				{/* 入力フィールド */}
				<div className="mb-7">
					<input
						type="text"
						value={contextName}
						onChange={(e) => setContextName(e.target.value)}
						placeholder={t("phrase.placeholders.situationInput")}
						className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
					/>

					{/* 50文字を超えた場合のバリデーションメッセージ */}
					{contextName.length > 50 && (
						<div className="mt-3 p-3 rounded-lg bg-red-50">
							<p className="text-sm text-red-600">
								{t("phrase.validation.situationMaxLength")}
							</p>
						</div>
					)}
				</div>

				{/* ボタン */}
				<div className="flex gap-3">
					<div className="flex-1">
						<PracticeButton
							onClick={handleCancel}
							variant="secondary"
						>
							{t("common.cancel")}
						</PracticeButton>
					</div>
					<div className="flex-1">
						<PracticeButton
							onClick={handleSubmit}
							disabled={!isValid}
							variant="primary"
						>
							{t("situation.addModal.addButton")}
						</PracticeButton>
					</div>
				</div>
			</div>
		</BaseModal>
	);
}
