"use client";

import { useEffect, useState } from "react";

export default function AppVersionChecker() {
	const [currentVersion, setCurrentVersion] = useState<string>("");

	useEffect(() => {
		// アプリのバージョンを確認
		const checkVersion = async () => {
			try {
				// ビルド時のタイムスタンプをバージョンとして使用
				const buildTime =
					process.env.NEXT_PUBLIC_BUILD_TIME || Date.now().toString();
				const storedVersion = localStorage.getItem("app-version");

				if (storedVersion && storedVersion !== buildTime) {
					// バージョンが変わった場合はリロード
					localStorage.setItem("app-version", buildTime);
					setTimeout(() => {
						window.location.reload();
					}, 500);
				} else if (!storedVersion) {
					// 初回アクセス
					localStorage.setItem("app-version", buildTime);
				}

				setCurrentVersion(buildTime);
			} catch {
				// バージョンチェックエラーは無視（静寂に失敗）
			}
		};

		// ページの可視性が変わった時（フォーカスが戻った時）にチェック
		const handleVisibilityChange = () => {
			if (!document.hidden) {
				checkVersion();
			}
		};

		checkVersion();
		document.addEventListener("visibilitychange", handleVisibilityChange);

		// 定期的にバージョンをチェック
		const interval = setInterval(checkVersion, 5 * 60 * 1000); // 5分ごと

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			clearInterval(interval);
		};
	}, []);

	// 開発環境でのみバージョンを表示
	if (process.env.NODE_ENV === "development" && currentVersion) {
		return (
			<div className="fixed bottom-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-50 z-50">
				v{currentVersion.slice(-8)}
			</div>
		);
	}

	return null;
}
