"use client";

import { useState } from "react";
import BaseModal from "../common/BaseModal";
import { useTranslation } from "@/hooks/ui/useTranslation";

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
	const { t } = useTranslation("common");
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

	return (
		<BaseModal isOpen={isOpen} onClose={handleCancel} title="Add Situation">
			{/* シチュエーション名入力 */}
			<div className="mb-8">
				<h3 className="text-lg font-semibold text-gray-900 mb-3">Situation</h3>
				<input
					type="text"
					value={contextName}
					onChange={(e) => setContextName(e.target.value)}
					placeholder={t("phrase.placeholders.situationInput")}
					className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm focus:outline-none"
				/>

				{/* 50文字を超えた場合のバリデーションメッセージ */}
				{contextName.length > 50 && (
					<div className="mt-2 p-3 border border-gray-300 rounded-md bg-gray-50">
						<p className="text-sm text-gray-600">
							{t("phrase.validation.situationMaxLength")}
						</p>
					</div>
				)}
			</div>

			{/* ボタン */}
			<div className="flex gap-3">
				<button
					onClick={handleCancel}
					className="flex-1 bg-white border py-2 px-4 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
					style={{
						borderColor: "#616161",
						color: "#616161",
					}}
				>
					Cancel
				</button>
				<button
					onClick={handleSubmit}
					disabled={!contextName.trim() || contextName.length > 50}
					className="flex-1 text-white py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed"
					style={{
						backgroundColor:
							!contextName.trim() || contextName.length > 50
								? "#9CA3AF"
								: "#616161",
					}}
				>
					Add
				</button>
			</div>
		</BaseModal>
	);
}
