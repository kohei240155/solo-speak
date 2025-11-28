import { SpeechListItem } from "@/types/speech";
import { IoCheckboxOutline } from "react-icons/io5";
import { GiChart } from "react-icons/gi";
import { BiCalendarAlt } from "react-icons/bi";
import { BsPencil } from "react-icons/bs";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useMemo, memo } from "react";
import DropdownMenu from "../common/DropdownMenu";

interface SpeechItemProps {
	speech: SpeechListItem;
	isMenuOpen: boolean;
	onMenuToggle: (speechId: string) => void;
	onSpeechClick: (speechId: string) => void;
	onEdit: (speech: SpeechListItem) => void;
	onDelete: (speechId: string) => void;
}

const SpeechItem = memo(
	({
		speech,
		isMenuOpen,
		onMenuToggle,
		onSpeechClick,
		onEdit,
		onDelete,
	}: SpeechItemProps) => {
		// ステータスに応じた色を取得
		const getStatusColor = (statusName: string) => {
			switch (statusName) {
				case "A":
					return "#1f2937"; // 最も濃いグレー (gray-800)
				case "B":
					return "#4b5563"; // 濃いグレー (gray-600)
				case "C":
					return "#6b7280"; // 中間グレー (gray-500)
				case "D":
					return "#9ca3af"; // 薄いグレー (gray-400)
				default:
					return "#d1d5db"; // 最も薄いグレー (gray-300)
			}
		};

		const borderColor = useMemo(
			() => getStatusColor(speech.status.name),
			[speech.status.name],
		);

		const formattedDate = useMemo(() => {
			const dateToFormat = speech.lastPracticedAt || speech.createdAt;
			return new Date(dateToFormat).toLocaleDateString("ja-JP", {
				year: "numeric",
				month: "numeric",
				day: "numeric",
			});
		}, [speech.lastPracticedAt, speech.createdAt]);

		return (
			<div
				className="pl-4 pr-6 py-4 bg-white shadow-md relative cursor-pointer"
				style={{
					borderLeft: `4px solid ${borderColor}`,
					borderRadius: "5px",
					minHeight: "120px",
				}}
				onClick={() => onSpeechClick(speech.id)}
			>
				{/* タイトル */}
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
						{speech.title}
					</div>
					<div className="relative flex-shrink-0">
						<DropdownMenu
							isOpen={isMenuOpen}
							onToggle={() => onMenuToggle(speech.id)}
							onClose={() => onMenuToggle("")}
							triggerSize="lg"
							width="w-36"
							fontSize="base"
							itemHeight="base"
							items={[
								{
									id: "edit",
									label: "Edit",
									icon: BsPencil,
									onClick: () => onEdit(speech),
								},
								{
									id: "delete",
									label: "Delete",
									icon: RiDeleteBin6Line,
									onClick: () => onDelete(speech.id),
									variant: "danger",
								},
							]}
						/>
					</div>
				</div>

				{/* 1フレーズ目のプレビュー */}
				{speech.firstPhrase?.original && (
					<div
						className="text-sm text-gray-600 mb-3 break-words overflow-hidden"
						style={{
							display: "-webkit-box",
							WebkitLineClamp: 2,
							WebkitBoxOrient: "vertical",
							wordWrap: "break-word",
							overflowWrap: "anywhere",
							wordBreak: "break-word",
						}}
					>
						{speech.firstPhrase.original}
					</div>
				)}

				{/* 練習回数、ステータス、日付 */}
				<div className="flex items-center justify-between text-xs text-gray-900 mt-4">
					<div className="flex items-center space-x-4">
						<span className="flex items-center">
							<IoCheckboxOutline className="w-4 h-4 mr-1" />
							{speech.practiceCount || 0}
						</span>
						<span className="flex items-center">
							<GiChart className="w-4 h-4 mr-1" />
							{speech.status.name}
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

SpeechItem.displayName = "SpeechItem";

export default SpeechItem;
