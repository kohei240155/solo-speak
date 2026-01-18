import BaseModal from "../common/BaseModal";
import PracticeButton from "../common/PracticeButton";
import { useTranslation } from "@/hooks/ui/useTranslation";
import { IoTimeOutline, IoCheckmarkCircleOutline, IoTrophyOutline } from "react-icons/io5";

interface PracticeHelpModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function PracticeHelpModal({
	isOpen,
	onClose,
}: PracticeHelpModalProps) {
	const { t } = useTranslation("app");

	return (
		<BaseModal
			isOpen={isOpen}
			onClose={onClose}
			title={t("practice.help.title")}
			width="420px"
			variant="gray"
		>
			<div className="space-y-3 mb-6">
				{/* 1日1回ルール */}
				<div className="bg-white rounded-xl p-4 shadow-sm">
					<div className="flex items-start gap-3">
						<div className="flex-shrink-0 w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
							<IoTimeOutline className="w-5 h-5 text-gray-600" />
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="text-sm font-semibold text-gray-900 mb-1">
								{t("practice.help.dailyLimit.title")}
							</h3>
							<p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
								{t("practice.help.dailyLimit.description")}
							</p>
						</div>
					</div>
				</div>

				{/* 90%でクリア */}
				<div className="bg-white rounded-xl p-4 shadow-sm">
					<div className="flex items-start gap-3">
						<div className="flex-shrink-0 w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
							<IoCheckmarkCircleOutline className="w-5 h-5 text-gray-600" />
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="text-sm font-semibold text-gray-900 mb-1">
								{t("practice.help.clearCondition.title")}
							</h3>
							<p className="text-sm text-gray-600 leading-relaxed">
								{t("practice.help.clearCondition.description")}
							</p>
						</div>
					</div>
				</div>

				{/* 5回でマスター */}
				<div className="bg-white rounded-xl p-4 shadow-sm">
					<div className="flex items-start gap-3">
						<div className="flex-shrink-0 w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
							<IoTrophyOutline className="w-5 h-5 text-gray-600" />
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="text-sm font-semibold text-gray-900 mb-1">
								{t("practice.help.masterCondition.title")}
							</h3>
							<p className="text-sm text-gray-600 leading-relaxed">
								{t("practice.help.masterCondition.description")}
							</p>
						</div>
					</div>
				</div>
			</div>

			<PracticeButton onClick={onClose} variant="primary">
				OK
			</PracticeButton>
		</BaseModal>
	);
}
