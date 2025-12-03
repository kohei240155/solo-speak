import BaseModal from "../common/BaseModal";
import { useTranslation } from "@/hooks/ui/useTranslation";
import { AiOutlineCaretRight } from "react-icons/ai";

interface SpeechHelpModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function SpeechHelpModal({
	isOpen,
	onClose,
}: SpeechHelpModalProps) {
	const { t } = useTranslation("app");

	return (
		<BaseModal
			isOpen={isOpen}
			onClose={onClose}
			title={t("speech.help.title")}
			width="500px"
		>
			<div className="mb-6">
				<div className="space-y-4">
					<div>
						<div className="flex items-center mb-2">
							<AiOutlineCaretRight className="w-4 h-4 mr-1 text-gray-600" />
							<h3 className="text-lg font-semibold text-gray-900">
								{t("speech.help.howToUse.title")}
							</h3>
						</div>
						<ol className="text-gray-700 leading-relaxed ml-5 pr-4 list-decimal space-y-1">
							<li>{t("speech.help.howToUse.step1")}</li>
							<li>{t("speech.help.howToUse.step2")}</li>
							<li>{t("speech.help.howToUse.step3")}</li>
							<li>{t("speech.help.howToUse.step4")}</li>
							<li>{t("speech.help.howToUse.step5")}</li>
						</ol>
					</div>

					<div>
						<div className="flex items-center mb-2">
							<AiOutlineCaretRight className="w-4 h-4 mr-1 text-gray-600" />
							<h3 className="text-lg font-semibold text-gray-900">
								{t("speech.help.notes.title")}
							</h3>
						</div>
						<ul className="text-gray-700 leading-relaxed ml-5 pr-4 list-disc space-y-1">
							<li>{t("speech.help.notes.dailyLimit")}</li>
							<li>{t("speech.help.notes.recordingTime")}</li>
						</ul>
					</div>
				</div>
			</div>

			<div className="flex justify-end">
				<button
					onClick={onClose}
					className="bg-white border py-2 px-6 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
					style={{
						borderColor: "#616161",
						color: "#616161",
					}}
				>
					Close
				</button>
			</div>
		</BaseModal>
	);
}
