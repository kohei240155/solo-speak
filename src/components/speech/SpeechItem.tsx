import { SpeechListItem } from "@/types/speech";
import { IoCheckboxOutline } from "react-icons/io5";
import { GiChart } from "react-icons/gi";
import { BiCalendarAlt } from "react-icons/bi";
import { useMemo, memo } from "react";

interface SpeechItemProps {
	speech: SpeechListItem;
	onSpeechClick: (speechId: string) => void;
}

const SpeechItem = memo(({ speech, onSpeechClick }: SpeechItemProps) => {
	// ステータスに応じた色を取得
	const getStatusColor = (statusName: string) => {
		switch (statusName) {
			case "A":
				return "#22c55e"; // green
			case "B":
				return "#3b82f6"; // blue
			case "C":
				return "#f59e0b"; // orange
			case "D":
				return "#ef4444"; // red
			default:
				return "#9ca3af"; // gray
		}
	};

	const borderColor = useMemo(
		() => getStatusColor(speech.status.name),
		[speech.status.name],
	);

	const formattedDate = useMemo(
		() =>
			new Date(speech.createdAt).toLocaleDateString("ja-JP", {
				year: "numeric",
				month: "numeric",
				day: "numeric",
			}),
		[speech.createdAt],
	);

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
			</div>

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
});

SpeechItem.displayName = "SpeechItem";

export default SpeechItem;
