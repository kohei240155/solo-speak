"use client";

import BaseModal from "../common/BaseModal";
import { useTranslation } from "@/hooks/ui/useTranslation";

interface BrowserSwitchHelpModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function BrowserSwitchHelpModal({
	isOpen,
	onClose,
}: BrowserSwitchHelpModalProps) {
	const { t } = useTranslation();

	return (
		<BaseModal
			isOpen={isOpen}
			onClose={onClose}
			title={t("auth.modal.browserSwitchHelp.title")}
			width="500px"
		>
			<div className="space-y-6">
				{/* Xアプリからの場合 */}
				<div className="border-l-4 border-blue-500 pl-4">
					<h3 className="font-semibold text-gray-900 mb-2">
						{t("auth.modal.browserSwitchHelp.xApp.title")}
					</h3>
					<ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
						<li>{t("auth.modal.browserSwitchHelp.xApp.step1")}</li>
					</ol>
				</div>

				{/* LINEアプリからの場合 */}
				<div className="border-l-4 border-green-500 pl-4">
					<h3 className="font-semibold text-gray-900 mb-2">
						{t("auth.modal.browserSwitchHelp.lineApp.title")}
					</h3>
					<ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
						<li>{t("auth.modal.browserSwitchHelp.lineApp.step1")}</li>
						<li>{t("auth.modal.browserSwitchHelp.lineApp.step2")}</li>
					</ol>
				</div>

				{/* その他のアプリの場合 */}
				<div className="border-l-4 border-gray-500 pl-4">
					<h3 className="font-semibold text-gray-900 mb-2">
						{t("auth.modal.browserSwitchHelp.general.title")}
					</h3>
					<p className="text-sm text-gray-700 leading-relaxed">
						{t("auth.modal.browserSwitchHelp.general.description")}
					</p>
				</div>
			</div>
		</BaseModal>
	);
}
