import BaseModal from "../common/BaseModal";
import { useTranslation } from "@/hooks/ui/useTranslation";
import { IoTimeOutline, IoInfiniteOutline } from "react-icons/io5";

interface PhraseGenerationHelpModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function PhraseGenerationHelpModal({
	isOpen,
	onClose,
}: PhraseGenerationHelpModalProps) {
	const { t } = useTranslation("app");

	return (
		<BaseModal
			isOpen={isOpen}
			onClose={onClose}
			title={t("phraseGeneration.help.title")}
			width="420px"
			variant="gray"
		>
			<div className="space-y-3 mb-6">
				{/* リセット時間カード */}
				<div className="bg-white rounded-xl p-4 shadow-sm">
					<div className="flex items-start gap-3">
						<div className="flex-shrink-0 w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
							<IoTimeOutline className="w-5 h-5 text-gray-600" />
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="text-sm font-semibold text-gray-900 mb-1">
								{t("phraseGeneration.help.resetTime.title")}
							</h3>
							<p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
								{t("phraseGeneration.help.resetTime.description")}
							</p>
						</div>
					</div>
				</div>

				{/* 生成回数カード */}
				<div className="bg-white rounded-xl p-4 shadow-sm">
					<div className="flex items-start gap-3">
						<div className="flex-shrink-0 w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
							<IoInfiniteOutline className="w-5 h-5 text-gray-600" />
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="text-sm font-semibold text-gray-900 mb-1">
								{t("phraseGeneration.help.dailyLimit.title")}
							</h3>
							<p className="text-sm text-gray-600 leading-relaxed">
								{t("phraseGeneration.help.dailyLimit.description")}
							</p>
						</div>
					</div>
				</div>
			</div>

			<button
				onClick={onClose}
				className="w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 bg-[#616161] text-white hover:bg-[#525252] active:scale-[0.98]"
			>
				OK
			</button>
		</BaseModal>
	);
}
