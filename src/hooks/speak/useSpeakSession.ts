import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { SpeakPhrase, SpeakConfig } from "@/types/speak";
import { useInfinitePhrases } from "@/hooks/api";
import { useTranslation } from "@/hooks/ui/useTranslation";

interface SpeakSessionState {
	active: boolean;
	config: SpeakConfig | null;
}

export const useSpeakSession = (learningLanguage: string) => {
	const { t } = useTranslation();

	// モード状態
	const [sessionState, setSessionState] = useState<SpeakSessionState>({
		active: false,
		config: null,
	});

	// フレーズデータ
	const [currentPhrase, setCurrentPhrase] = useState<SpeakPhrase | null>(null);
	const [isLoadingPhrase, setIsLoadingPhrase] = useState(false);
	const [todayCount, setTodayCount] = useState(0);
	const [totalCount, setTotalCount] = useState(0);
	const [pendingCount, setPendingCount] = useState(0);
	const [isCountDisabled, setIsCountDisabled] = useState(false);

	// Phrase Listのキャッシュを取得（キャッシュ無効化用）
	const { refetch: refetchPhraseList } = useInfinitePhrases(learningLanguage);

	// 初回レンダリングフラグ
	const hasInitialized = useRef(false);

	// URL管理: URLパラメータから設定を読み取る
	const readConfigFromURL = useCallback((): SpeakConfig | null => {
		const params = new URLSearchParams(window.location.search);
		const urlLanguage = params.get("language");

		if (!urlLanguage) return null;

		const excludeIfSpeakCountGTE = params.get("excludeIfSpeakCountGTE");
		const excludeTodayPracticed = params.get("excludeTodayPracticed");

		return {
			language: urlLanguage,
			excludeIfSpeakCountGTE: excludeIfSpeakCountGTE
				? parseInt(excludeIfSpeakCountGTE, 10)
				: undefined,
			excludeTodayPracticed: excludeTodayPracticed === "true",
		};
	}, []);

	// URL管理: 設定をURLパラメータに書き込む
	const writeConfigToURL = useCallback((config: SpeakConfig) => {
		const params = new URLSearchParams(window.location.search);

		params.set("language", config.language);

		if (config.excludeIfSpeakCountGTE !== undefined) {
			params.set(
				"excludeIfSpeakCountGTE",
				config.excludeIfSpeakCountGTE.toString(),
			);
		} else {
			params.delete("excludeIfSpeakCountGTE");
		}

		params.set(
			"excludeTodayPracticed",
			(config.excludeTodayPracticed ?? true).toString(),
		);

		const newUrl = `${window.location.pathname}?${params.toString()}`;
		window.history.replaceState({}, "", newUrl);
	}, []);

	// URL管理: URLパラメータをクリア
	const clearURL = useCallback(() => {
		const newUrl = window.location.pathname;
		window.history.replaceState({}, "", newUrl);
	}, []);

	// 今日のカウントに基づいてCountボタンの状態を更新
	const updateCountButtonState = useCallback((actualTodayCount: number) => {
		setIsCountDisabled(actualTodayCount >= 100);
	}, []);

	// カウントをサーバーに送信する関数
	const sendPendingCount = useCallback(
		async (phraseId: string, countToSend: number): Promise<boolean> => {
			if (countToSend === 0) return true;

			try {
				await api.post(`/api/phrase/${phraseId}/count`, { count: countToSend });
				return true;
			} catch {
				toast.error(t("phrase.messages.countError"));
				return false;
			}
		},
		[t],
	);

	// フレーズを取得する関数
	const fetchSpeakPhrase = useCallback(
		async (config: SpeakConfig): Promise<boolean | "allDone"> => {
			setIsLoadingPhrase(true);
			try {
				const params = new URLSearchParams({
					language: config.language,
					excludeTodayPracticed: (
						config.excludeTodayPracticed ?? true
					).toString(),
				});

				if (config.excludeIfSpeakCountGTE !== undefined) {
					params.append(
						"excludeIfSpeakCountGTE",
						config.excludeIfSpeakCountGTE.toString(),
					);
				}

				const data = await api.get<{
					success: boolean;
					phrase?: SpeakPhrase;
					message?: string;
					allDone?: boolean;
					dailyLimitReached?: boolean;
				}>(`/api/phrase/speak?${params.toString()}`);

				if (data.success && data.phrase) {
					setCurrentPhrase(data.phrase);
					setTodayCount(data.phrase.dailySpeakCount || 0);
					setTotalCount(data.phrase.totalSpeakCount || 0);
					setPendingCount(0);
					updateCountButtonState(data.phrase.dailySpeakCount || 0);
					return true;
				} else {
					return "allDone";
				}
			} catch {
				toast.error(t("phrase.messages.fetchError"));
				return false;
			} finally {
				setIsLoadingPhrase(false);
			}
		},
		[updateCountButtonState, t],
	);

	// ページ読み込み時にURLパラメータから設定を復元
	useEffect(() => {
		if (hasInitialized.current) return;
		if (!learningLanguage) return;

		const config = readConfigFromURL();
		if (config) {
			setSessionState({ active: true, config });
			fetchSpeakPhrase(config);
		}

		hasInitialized.current = true;
	}, [learningLanguage, readConfigFromURL, fetchSpeakPhrase]);

	// ページ離脱時に保留中のカウントを送信
	useEffect(() => {
		const handleVisibilityChange = async () => {
			if (
				document.visibilityState === "hidden" &&
				currentPhrase &&
				pendingCount > 0
			) {
				await sendPendingCount(currentPhrase.id, pendingCount);
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [currentPhrase, pendingCount, sendPendingCount]);

	// 日付変更の検出（UTC基準）
	useEffect(() => {
		let currentUTCDate = new Date().toISOString().split("T")[0];

		const checkDateChange = () => {
			const newUTCDate = new Date().toISOString().split("T")[0];
			if (newUTCDate !== currentUTCDate) {
				currentUTCDate = newUTCDate;
				if (currentPhrase && sessionState.config) {
					fetchSpeakPhrase(sessionState.config);
				}
			}
		};

		const interval = setInterval(checkDateChange, 60 * 1000);
		return () => clearInterval(interval);
	}, [currentPhrase, sessionState.config, fetchSpeakPhrase]);

	// 練習開始
	const handleStart = useCallback(
		async (config: SpeakConfig) => {
			setSessionState({ active: true, config });
			writeConfigToURL(config);

			const result = await fetchSpeakPhrase(config);
			if (result === "allDone") {
				return false;
			}

			return result;
		},
		[writeConfigToURL, fetchSpeakPhrase],
	);

	// カウント機能
	const handleCount = useCallback(async () => {
		if (!currentPhrase) return;

		const newPendingCount = pendingCount + 1;
		setPendingCount(newPendingCount);

		const newTodayCount = todayCount + 1;
		setTodayCount(newTodayCount);
		setTotalCount((prev) => prev + 1);

		setCurrentPhrase((prev) =>
			prev
				? {
						...prev,
						totalSpeakCount: prev.totalSpeakCount + 1,
					}
				: null,
		);

		if (newTodayCount === 100) {
			toast.error(t("speak.messages.dailyLimitReached"), {
				duration: 4000,
			});
		}

		updateCountButtonState(newTodayCount);
	}, [currentPhrase, todayCount, pendingCount, updateCountButtonState, t]);

	// 次のフレーズを取得
	const handleNext = useCallback(
		async (config: SpeakConfig): Promise<boolean | "allDone"> => {
			if (!currentPhrase) {
				return await fetchSpeakPhrase(config);
			}

			// まずローディング状態にして、現在のカウントを維持したまま画面を固定
			setIsLoadingPhrase(true);

			// ペンディングカウントがある場合は送信
			if (pendingCount > 0) {
				const success = await sendPendingCount(currentPhrase.id, pendingCount);
				if (success) {
					setPendingCount(0);
				} else {
					toast.error(t("phrase.messages.countError"));
					setIsLoadingPhrase(false);
					return false;
				}
			} else {
				// カウントが0でもsession_spokenをtrueに設定
				try {
					await api.post(`/api/phrase/${currentPhrase.id}/count`, { count: 0 });
				} catch {
					// session_spoken設定エラーは次のフレーズ取得を阻害しない
				}
			}

			// カウント送信後に次のフレーズを取得（fetchSpeakPhrase内でsetIsLoadingPhrase(false)される）
			const result = await fetchSpeakPhrase(config);
			return result;
		},
		[currentPhrase, pendingCount, sendPendingCount, fetchSpeakPhrase, t],
	);

	// 練習終了
	const handleFinish = useCallback(async () => {
		if (!currentPhrase) return;

		// ペンディングカウントがある場合は送信
		if (pendingCount > 0) {
			const success = await sendPendingCount(currentPhrase.id, pendingCount);
			if (!success) {
				toast.error(t("phrase.messages.countError"));
			}
		} else {
			// カウントが0でもsession_spokenをtrueに設定
			try {
				await api.post(`/api/phrase/${currentPhrase.id}/count`, { count: 0 });
			} catch {
				// エラーは無視
			}
		}

		// Phrase Listのキャッシュを無効化
		refetchPhraseList();

		// 状態をリセット
		setSessionState({ active: false, config: null });
		setCurrentPhrase(null);
		setTodayCount(0);
		setTotalCount(0);
		setPendingCount(0);
		clearURL();
	}, [
		currentPhrase,
		pendingCount,
		sendPendingCount,
		refetchPhraseList,
		clearURL,
		t,
	]);

	// 設定リセット
	const resetSession = useCallback(() => {
		setSessionState({ active: false, config: null });
		clearURL();
		// 初回レンダリングフラグもリセットして、次回のモーダル開始時に設定を復元できるようにする
		hasInitialized.current = false;
	}, [clearURL]);

	return {
		// セッション状態
		sessionState,

		// フレーズデータ
		currentPhrase,
		isLoadingPhrase,
		todayCount,
		totalCount,
		pendingCount,
		isCountDisabled,

		// 操作関数
		handleStart,
		handleCount,
		handleNext,
		handleFinish,
		resetSession,
		sendPendingCount,
		refetchPhraseList,
	};
};
