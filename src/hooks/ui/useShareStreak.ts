import { useState } from "react";
import toast from "react-hot-toast";
import { LANGUAGE_NAMES, type LanguageCode } from "@/constants/languages";
import { useTranslation } from "./useTranslation";

type RankingType = "phrase" | "speak" | "quiz" | "speech";
type TabType = "Daily" | "Weekly" | "Total" | "Streak";

export const useShareStreak = () => {
	const [isLoading, setIsLoading] = useState(false);
	const { t } = useTranslation("app");

	const shareStreak = async (
		language: string,
		count: number,
		rankingType: RankingType,
		tabType: TabType,
	) => {
		setIsLoading(true);
		try {
			if (count === 0) {
				toast.error(t("ranking.shareStreak.error.noCount"));
				return null;
			}

			// 既存の言語定数から言語名を取得
			const languageName = LANGUAGE_NAMES[language as LanguageCode] || language;

			// ランキングタイプとタブに応じてメッセージを生成
			let shareText = `${t("ranking.shareStreak.intro")}\n\n`;

			if (rankingType === "phrase") {
				if (tabType === "Total") {
					shareText += t("ranking.shareStreak.phrase.total", { count });
				} else if (tabType === "Streak") {
					shareText += t("ranking.shareStreak.phrase.streak", { count });
				}
			} else if (rankingType === "speak") {
				if (tabType === "Daily") {
					shareText += t("ranking.shareStreak.speak.daily", { count });
				} else if (tabType === "Weekly") {
					shareText += t("ranking.shareStreak.speak.weekly", { count });
				} else if (tabType === "Total") {
					shareText += t("ranking.shareStreak.speak.total", { count });
				} else if (tabType === "Streak") {
					shareText += t("ranking.shareStreak.speak.streak", { count });
				}
			} else if (rankingType === "quiz") {
				if (tabType === "Daily") {
					shareText += t("ranking.shareStreak.quiz.daily", { count });
				} else if (tabType === "Weekly") {
					shareText += t("ranking.shareStreak.quiz.weekly", { count });
				} else if (tabType === "Total") {
					shareText += t("ranking.shareStreak.quiz.total", { count });
				} else if (tabType === "Streak") {
					shareText += t("ranking.shareStreak.quiz.streak", { count });
				}
			} else if (rankingType === "speech") {
				if (tabType === "Total") {
					shareText += t("ranking.shareStreak.speech.total", { count });
				} else if (tabType === "Streak") {
					shareText += t("ranking.shareStreak.speech.streak", { count });
				}
			}

			shareText += `\n\n${t("ranking.shareStreak.url")} \n${t("ranking.shareStreak.hashtag")}`;

			// Twitter/X用のURLを生成
			const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

			// 新しいタブでTwitterを開く
			window.open(twitterUrl, "_blank", "noopener,noreferrer");

			return { count, shareText, language: languageName, rankingType, tabType };
		} catch (error) {
			console.error("Share streak error:", error);
			toast.error(t("ranking.shareStreak.error.failed"));
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	return {
		shareStreak,
		isLoading,
	};
};
