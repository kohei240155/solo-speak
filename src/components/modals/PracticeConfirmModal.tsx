"use client";

import React from "react";
import BaseModal from "../common/BaseModal";
import AnimatedButton from "../common/AnimatedButton";

interface PracticeConfirmModalProps {
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export default function PracticeConfirmModal({
	isOpen,
	onConfirm,
	onCancel,
}: PracticeConfirmModalProps) {
	return (
		<BaseModal isOpen={isOpen} onClose={onCancel} title="Confirm Practice">
			{/* メッセージエリア */}
			<div className="mb-20">
				<p className="text-base text-gray-700 leading-relaxed">
					このまま復習モードに進みますか？
				</p>
			</div>

			{/* ボタン */}
			<div className="flex gap-3">
				<AnimatedButton onClick={onCancel} variant="secondary">
					いいえ
				</AnimatedButton>
				<AnimatedButton onClick={onConfirm} variant="primary">
					はい
				</AnimatedButton>
			</div>
		</BaseModal>
	);
}
