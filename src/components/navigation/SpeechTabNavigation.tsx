import { useRouter } from "next/navigation";

type SpeechTabType = "List" | "Add" | "Review";

interface SpeechTabNavigationProps {
	activeTab: SpeechTabType;
	checkUnsavedChanges?: () => boolean;
	onReviewModalOpen?: () => void;
	isShowingResult?: boolean; // Result画面を表示中かどうか
}

export default function SpeechTabNavigation({
	activeTab,
	checkUnsavedChanges,
	onReviewModalOpen,
	isShowingResult = false,
}: SpeechTabNavigationProps) {
	const router = useRouter();

	const tabs: { key: SpeechTabType; label: string; path: string }[] = [
		{ key: "List", label: "List", path: "/speech/list" },
		{ key: "Add", label: "Add", path: "/speech/add" },
		{ key: "Review", label: "Review", path: "/speech/review" },
	];

	const handleTabClick = (tab: {
		key: SpeechTabType;
		label: string;
		path: string;
	}) => {
		// アクティブなタブがクリックされた場合は何もしない
		if (activeTab === tab.key) {
			return;
		}

		// Reviewタブの場合は常にモーダルを表示（ページ遷移はしない）
		if (tab.key === "Review") {
			if (onReviewModalOpen) {
				onReviewModalOpen();
			}
			return;
		}

		// 未保存の変更チェック（Add/Reviewタブから離脱する場合）
		if (
			(activeTab === "Add" || activeTab === "Review") &&
			tab.key !== activeTab &&
			checkUnsavedChanges
		) {
			if (checkUnsavedChanges()) {
				let message = "";
				if (activeTab === "Add") {
					// Addタブの場合、Result画面かどうかでメッセージを変える
					message = isShowingResult
						? "添削内容が失われます。このまま移動しますか？"
						: "入力した内容が削除されます。このまま移動しますか？";
				} else {
					// Reviewタブの場合
					message =
						"保存されていないカウントがあります。このまま移動しますか？";
				}

				const confirmLeave = window.confirm(message);
				if (!confirmLeave) {
					return;
				}
			}
		} // ページ遷移
		router.push(tab.path);
	};

	return (
		<div className="flex mb-[18px]" data-tab-navigation>
			{tabs.map((tab, index) => (
				<button
					key={tab.key}
					onClick={() => handleTabClick(tab)}
					className={`flex-1 py-2 text-sm md:text-base border border-gray-300 ${
						index === 0 ? "rounded-l-[20px]" : ""
					} ${index === tabs.length - 1 ? "rounded-r-[20px]" : ""} ${
						index > 0 ? "border-l-0" : ""
					} ${
						activeTab === tab.key
							? "bg-gray-200 text-gray-700 font-bold cursor-default"
							: "bg-white text-gray-700 font-normal cursor-pointer hover:bg-gray-50"
					}`}
				>
					{tab.label}
				</button>
			))}
		</div>
	);
}
