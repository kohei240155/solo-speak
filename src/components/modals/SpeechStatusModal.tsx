"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/ui/useTranslation";
import BaseModal from "../common/BaseModal";
import AnimatedButton from "../common/AnimatedButton";

export interface SpeechStatus {
	id: string;
	name: string;
}

interface SpeechStatusModalProps {
	isOpen: boolean;
	onClose: () => void;
	statuses: SpeechStatus[];
	currentStatusId: string;
	onStatusChange: (statusId: string) => Promise<void>;
	isLoading?: boolean;
}

export default function SpeechStatusModal({
	isOpen,
	onClose,
	statuses,
	currentStatusId,
	onStatusChange,
	isLoading: externalLoading = false,
}: SpeechStatusModalProps) {
	const { t } = useTranslation("app");
	const [selectedStatusId, setSelectedStatusId] = useState(currentStatusId);
	const [internalLoading, setInternalLoading] = useState(false);

	const isLoading = externalLoading || internalLoading;

	// 現在のステータスを初期値として設定
	useEffect(() => {
		if (isOpen) {
			setSelectedStatusId(currentStatusId);
			setInternalLoading(false);
		}
	}, [isOpen, currentStatusId]);

	const handleSave = async () => {
		if (isLoading) return;

		setInternalLoading(true);
		try {
			await onStatusChange(selectedStatusId);
			onClose();
		} catch (error) {
			console.error("Failed to update status:", error);
		} finally {
			setInternalLoading(false);
		}
	};

	// セレクトボックスのスタイル定義
	const selectStyle = {
		backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
		backgroundRepeat: "no-repeat",
		backgroundPosition: "right 12px center",
		backgroundSize: "20px",
	};

	const selectedStatus = statuses.find((s) => s.id === selectedStatusId);
	const statusDescription = selectedStatus
		? t(`speech.status.${selectedStatus.name}`)
		: "";

	return (
		<BaseModal isOpen={isOpen} onClose={onClose} title="Change Status">
			{/* Status Select */}
			<div className="mb-4">
				<h3 className="text-base font-medium text-gray-900 mb-3">Status</h3>
				<div className="relative">
					<select
						value={selectedStatusId}
						onChange={(e) => setSelectedStatusId(e.target.value)}
						className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-gray-900"
						style={selectStyle}
					>
						{statuses.map((status) => (
							<option key={status.id} value={status.id}>
								{status.name}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Explanation Section */}
			{statusDescription && (
				<div className="mb-8">
					<h3 className="text-base font-medium text-gray-900 mb-3">
						Explanation
					</h3>
					<div className="px-3 py-3 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-md">
						{statusDescription}
					</div>
				</div>
			)}

			{/* Save Button */}
			<AnimatedButton
				onClick={handleSave}
				disabled={isLoading}
				isLoading={isLoading}
			>
				Save
			</AnimatedButton>
		</BaseModal>
	);
}
