import { TabType } from "@/types/phrase";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/ui/useTranslation";

// デザインパターンの種類
export type TabDesignPattern =
	| "default"      // 現在のスタイル（グレーボーダー、控えめ）
	| "default-emphasis" // default配色でサイズ・フォント強調
	| "default-emphasis-dark" // default-emphasisの色濃いめ
	| "bold"         // 大きめテキスト、濃いグレー背景
	| "pill"         // ピル型、コントラスト強め
	| "pill-connected" // pill配色で連結型
	| "pill-soft"    // pill連結型、優しい配色
	| "underline"    // アンダーライン型
	| "elevated"     // 影付き、立体的
	| "modern";      // モダン、アクセントカラー

interface PhraseTabNavigationProps {
	activeTab: TabType;
	checkUnsavedChanges?: () => boolean; // Optional function to check for unsaved changes
	onSpeakModalOpen?: () => void; // Speak modal open handler
	onQuizModalOpen?: () => void; // Quiz modal open handler
	onPracticeModalOpen?: () => void; // Practice modal open handler
	onCacheInvalidate?: () => void; // Optional function to invalidate caches when leaving
	phraseMode?: "speak" | "quiz" | "practice"; // User's phrase mode setting
	designPattern?: TabDesignPattern; // デザインパターン選択
}

export default function PhraseTabNavigation({
	activeTab,
	checkUnsavedChanges,
	onSpeakModalOpen,
	onQuizModalOpen,
	onPracticeModalOpen,
	onCacheInvalidate,
	phraseMode = "practice",
	designPattern = "default-emphasis-dark",
}: PhraseTabNavigationProps) {
	const router = useRouter();
	const { t } = useTranslation("app");

	// phraseModeに応じてタブをフィルタリング
	const allTabs: { key: TabType; label: string; path: string }[] = [
		{ key: "List", label: "List", path: "/phrase/list" },
		{ key: "Add", label: "Add", path: "/phrase/add" },
		{ key: "Speak", label: "Speak", path: "/phrase/speak" },
		{ key: "Quiz", label: "Quiz", path: "/phrase/quiz" },
		{ key: "Practice", label: "Practice", path: "/phrase/practice" },
	];

	// phraseMode === "practice" の場合は Speak/Quiz を非表示
	// phraseMode === "speak" or "quiz" の場合は Practice を非表示
	const tabs = allTabs.filter((tab) => {
		if (phraseMode === "practice") {
			return tab.key !== "Speak" && tab.key !== "Quiz";
		} else {
			return tab.key !== "Practice";
		}
	});

	const handleTabClick = (tab: {
		key: TabType;
		label: string;
		path: string;
	}) => {
		// アクティブなタブがクリックされた場合は何もしない
		if (activeTab === tab.key) {
			return;
		}

		// 未保存の変更チェック（Add/Speak/Quiz/Practiceタブから離脱する場合）
		if (
			(activeTab === "Add" || activeTab === "Speak" || activeTab === "Quiz" || activeTab === "Practice") &&
			tab.key !== activeTab &&
			checkUnsavedChanges
		) {
			if (checkUnsavedChanges()) {
				const message =
					activeTab === "Add"
						? t("confirm.unsavedPhrase")
						: t("confirm.unsavedCount");
				const confirmLeave = window.confirm(message);
				if (!confirmLeave) {
					return; // ユーザーがキャンセルした場合は何もしない
				}
				// ユーザーがOKを押した場合、キャッシュを無効化
				if (onCacheInvalidate) {
					onCacheInvalidate();
				}
			}
		}

		// Speakタブの場合は常にモーダルを表示（ページ遷移はしない）
		if (tab.key === "Speak") {
			if (onSpeakModalOpen) {
				onSpeakModalOpen();
			}
			// onSpeakModalOpenがない場合でも、ページ遷移はしない
			// モーダルが必須なので、何もしない
			return;
		}

		// Quizタブの場合は常にモーダルを表示（ページ遷移はしない）
		if (tab.key === "Quiz") {
			if (onQuizModalOpen) {
				onQuizModalOpen();
			}
			// onQuizModalOpenがない場合でも、ページ遷移はしない
			// モーダルが必須なので、何もしない
			return;
		}

		// Practiceタブの場合は常にモーダルを表示（ページ遷移はしない）
		if (tab.key === "Practice") {
			if (onPracticeModalOpen) {
				onPracticeModalOpen();
			}
			// onPracticeModalOpenがない場合でも、ページ遷移はしない
			// モーダルが必須なので、何もしない
			return;
		}

		// ListタブとAddタブの場合はページ遷移
		router.push(tab.path);
	};

	// デザインパターンごとのスタイル定義
	const getContainerStyles = (): string => {
		switch (designPattern) {
			case "underline":
				return "flex mb-[18px] border-b-2 border-gray-200";
			case "pill":
				return "flex mb-[18px] gap-2 bg-gray-100 p-1 rounded-full";
			case "elevated":
				return "flex mb-[18px] gap-1";
			case "modern":
				return "flex mb-[18px] gap-3";
			case "bold":
				return "flex mb-[18px]";
			default:
				return "flex mb-[18px]";
		}
	};

	const getTabStyles = (isActive: boolean, index: number): string => {
		const isFirst = index === 0;
		const isLast = index === tabs.length - 1;

		switch (designPattern) {
			case "default-emphasis":
				// default配色でサイズ大きめ・フォント太め
				return `flex-1 py-2.5 text-base md:text-lg border border-gray-300 ${
					isFirst ? "rounded-l-[20px]" : ""
				} ${isLast ? "rounded-r-[20px]" : ""} ${
					index > 0 ? "border-l-0" : ""
				} ${
					isActive
						? "bg-gray-200 text-gray-800 font-bold cursor-default"
						: "bg-white text-gray-700 font-medium cursor-pointer hover:bg-gray-50"
				}`;

			case "default-emphasis-dark":
				// default-emphasisの色濃いめ
				return `flex-1 py-2.5 text-base md:text-lg border border-gray-300 ${
					isFirst ? "rounded-l-[20px]" : ""
				} ${isLast ? "rounded-r-[20px]" : ""} ${
					index > 0 ? "border-l-0" : ""
				} ${
					isActive
						? "bg-gray-200 text-gray-800 font-bold cursor-default"
						: "bg-white text-gray-700 font-medium cursor-pointer hover:bg-gray-50"
				}`;

			case "bold":
				// パターン1: 大きめテキスト、濃いグレー背景
				return `flex-1 py-3 text-base md:text-lg border-2 border-gray-400 ${
					isFirst ? "rounded-l-[20px]" : ""
				} ${isLast ? "rounded-r-[20px]" : ""} ${
					index > 0 ? "border-l-0" : ""
				} ${
					isActive
						? "bg-gray-700 text-white font-bold cursor-default"
						: "bg-white text-gray-700 font-medium cursor-pointer hover:bg-gray-100"
				}`;

			case "pill":
				// パターン2: ピル型、個別のボタン
				return `flex-1 py-2.5 text-sm md:text-base rounded-full transition-all ${
					isActive
						? "bg-gray-800 text-white font-bold cursor-default shadow-md"
						: "bg-transparent text-gray-600 font-medium cursor-pointer hover:bg-gray-200"
				}`;

			case "pill-connected":
				// パターン2b: pill配色で連結型（現在の形）
				return `flex-1 py-2.5 text-sm md:text-base border border-gray-300 transition-all ${
					isFirst ? "rounded-l-[20px]" : ""
				} ${isLast ? "rounded-r-[20px]" : ""} ${
					index > 0 ? "border-l-0" : ""
				} ${
					isActive
						? "bg-gray-800 text-white font-bold cursor-default"
						: "bg-white text-gray-600 font-medium cursor-pointer hover:bg-gray-100"
				}`;

			case "pill-soft":
				// パターン2c: pill連結型、モダンで優しい配色
				return `flex-1 py-2.5 text-sm md:text-base border border-gray-200 transition-all ${
					isFirst ? "rounded-l-[20px]" : ""
				} ${isLast ? "rounded-r-[20px]" : ""} ${
					index > 0 ? "border-l-0" : ""
				} ${
					isActive
						? "bg-gray-600 text-white font-semibold cursor-default"
						: "bg-gray-50 text-gray-500 font-medium cursor-pointer hover:bg-gray-100 hover:text-gray-600"
				}`;

			case "underline":
				// パターン3: アンダーライン型
				return `flex-1 py-3 text-sm md:text-base -mb-[2px] border-b-2 transition-all ${
					isActive
						? "border-gray-800 text-gray-900 font-bold cursor-default"
						: "border-transparent text-gray-500 font-medium cursor-pointer hover:text-gray-700 hover:border-gray-300"
				}`;

			case "elevated":
				// パターン4: 影付き、立体的
				return `flex-1 py-2.5 text-sm md:text-base rounded-lg transition-all ${
					isActive
						? "bg-white text-gray-900 font-bold cursor-default shadow-md border border-gray-200"
						: "bg-gray-50 text-gray-600 font-medium cursor-pointer hover:bg-gray-100 border border-transparent"
				}`;

			case "modern":
				// パターン5: モダン、グレーアクセント
				return `flex-1 py-2.5 text-sm md:text-base rounded-xl transition-all ${
					isActive
						? "bg-gray-900 text-white font-bold cursor-default"
						: "bg-gray-100 text-gray-600 font-medium cursor-pointer hover:bg-gray-200"
				}`;

			default:
				// 現在のスタイル
				return `flex-1 py-2 text-sm md:text-base border border-gray-300 ${
					isFirst ? "rounded-l-[20px]" : ""
				} ${isLast ? "rounded-r-[20px]" : ""} ${
					index > 0 ? "border-l-0" : ""
				} ${
					isActive
						? "bg-gray-200 text-gray-700 font-bold cursor-default"
						: "bg-white text-gray-700 font-normal cursor-pointer hover:bg-gray-50"
				}`;
		}
	};

	return (
		<div className={getContainerStyles()} data-tab-navigation>
			{tabs.map((tab, index) => (
				<button
					key={tab.key}
					onClick={() => handleTabClick(tab)}
					className={getTabStyles(activeTab === tab.key, index)}
				>
					{tab.label}
				</button>
			))}
		</div>
	);
}
