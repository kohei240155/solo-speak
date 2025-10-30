import { SavedPhrase } from "@/types/phrase";
import { getPhraseLevelColorByCorrectAnswers } from "@/utils/phrase-level-utils";
import { RiSpeakLine, RiDeleteBin6Line } from "react-icons/ri";
import { IoCheckboxOutline } from "react-icons/io5";
import { BiCalendarAlt, BiCommentDetail } from "react-icons/bi";
import { BsPencil } from "react-icons/bs";
import { useMemo, memo } from "react";
import DropdownMenu from "../common/DropdownMenu";

interface PhraseItemProps {
	phrase: SavedPhrase;
	isMenuOpen: boolean;
	onMenuToggle: (phraseId: string) => void;
	onEdit: (phrase: SavedPhrase) => void;
	onSpeak: (phraseId: string) => void;
	onDelete: (phraseId: string) => void;
	onExplanation: (phrase: SavedPhrase) => void;
}

const PhraseItem = memo(
	({
		phrase,
		isMenuOpen,
		onMenuToggle,
		onEdit,
		onSpeak,
		onDelete,
		onExplanation,
	}: PhraseItemProps) => {
		const borderColor = useMemo(
			() => getPhraseLevelColorByCorrectAnswers(phrase.correctAnswers || 0),
			[phrase.correctAnswers],
		);

		const formattedDate = useMemo(
			() =>
				new Date(phrase.createdAt).toLocaleDateString("ja-JP", {
					year: "numeric",
					month: "numeric",
					day: "numeric",
				}),
			[phrase.createdAt],
		);

		return (
			<div
				className="pl-4 pr-6 py-4 bg-white shadow-md relative cursor-pointer"
				style={{
					borderLeft: `4px solid ${borderColor}`,
					borderRadius: "5px",
					minHeight: "120px",
				}}
				onClick={() => onSpeak(phrase.id)}
			>
				<div className="flex justify-between mb-2">
					<div
						className="text-base font-medium text-gray-900 flex-1 pr-2 break-words"
						style={{
							wordWrap: "break-word",
							overflowWrap: "anywhere",
							wordBreak: "break-word",
							minHeight: "24px",
						}}
					>
						{phrase.original}
					</div>
					<div className="relative flex-shrink-0">
						<DropdownMenu
							isOpen={isMenuOpen}
							onToggle={() => onMenuToggle(phrase.id)}
							onClose={() => onMenuToggle("")}
							triggerSize="lg"
							width="w-36"
							fontSize="base"
							itemHeight="base"
							items={[
								{
									id: "explanation",
									label: "Explanation",
									icon: BiCommentDetail,
									onClick: () => onExplanation(phrase),
								},
								{
									id: "edit",
									label: "Edit",
									icon: BsPencil,
									onClick: () => onEdit(phrase),
								},
								{
									id: "delete",
									label: "Delete",
									icon: RiDeleteBin6Line,
									onClick: () => onDelete(phrase.id),
									variant: "danger",
								},
							]}
						/>
					</div>
				</div>
				<div className="flex justify-between mb-3">
					<div
						className="text-sm text-gray-600 break-words flex-1 pr-2"
						style={{
							wordWrap: "break-word",
							overflowWrap: "anywhere",
							wordBreak: "break-word",
							minHeight: "20px",
						}}
					>
						{phrase.translation}
					</div>
					<div className="relative flex-shrink-0 w-5">
						{/* 三点リーダーと同じ幅のスペースを確保 */}
					</div>
				</div>
				<div className="flex items-center justify-between text-xs text-gray-900">
					<div className="flex items-center space-x-4">
						<span className="flex items-center">
							<RiSpeakLine className="w-4 h-4 mr-1" />
							{phrase.practiceCount || 0}
						</span>
						<span className="flex items-center">
							<IoCheckboxOutline className="w-4 h-4 mr-1" />
							{phrase.correctAnswers || 0}
						</span>
					</div>
					<div className="flex items-center">
						<BiCalendarAlt className="w-4 h-4 mr-1" />
						{formattedDate}
					</div>
				</div>
			</div>
		);
	},
);

PhraseItem.displayName = "PhraseItem";

export default PhraseItem;
