import BaseModal from "../common/BaseModal";
import { useTranslation } from "@/hooks/ui/useTranslation";
import { AiOutlineCaretRight } from "react-icons/ai";

interface PhraseGenerationHelpModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function PhraseGenerationHelpModal({
	isOpen,
	onClose,
}: PhraseGenerationHelpModalProps) {
	const { t } = useTranslation("common");

	return (
		<BaseModal
			isOpen={isOpen}
			onClose={onClose}
			title={t("phraseGeneration.help.title")}
			width="500px"
		>
			<div className="mb-6">
				<div className="space-y-4">
					<div>
						<div className="flex items-center mb-2">
							<AiOutlineCaretRight className="w-4 h-4 mr-1 text-gray-600" />
							<h3 className="text-lg font-semibold text-gray-900">
								{t("phraseGeneration.help.resetTime.title")}
							</h3>
						</div>
						<p className="text-gray-700 leading-relaxed ml-5 pr-4 whitespace-pre-line">
							{t("phraseGeneration.help.resetTime.description")}
						</p>
					</div>

					<div>
						<div className="flex items-center mb-2">
							<AiOutlineCaretRight className="w-4 h-4 mr-1 text-gray-600" />
							<h3 className="text-lg font-semibold text-gray-900">
								{t("phraseGeneration.help.dailyLimit.title")}
							</h3>
						</div>
						<p className="text-gray-700 leading-relaxed ml-5 pr-4">
							{t("phraseGeneration.help.dailyLimit.description")}
						</p>
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
