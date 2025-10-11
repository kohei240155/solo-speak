"use client";

import { useEffect } from "react";

export default function DeploymentChecker() {
  useEffect(() => {
    // ビルド時刻をチェックして、新しいデプロイがあった場合強制リロード
    const checkForUpdates = async () => {
      try {
        // 現在のビルド時刻
        const currentBuildTime = process.env.NEXT_PUBLIC_BUILD_TIME;

        // ローカルストレージから前回のビルド時刻を取得
        const lastKnownBuildTime = localStorage.getItem("app_build_time");

        if (
          lastKnownBuildTime &&
          currentBuildTime &&
          lastKnownBuildTime !== currentBuildTime
        ) {
          // 新しいデプロイが検出された場合、キャッシュをクリアしてリロード
          await clearAllCaches();

          // ビルド時刻を更新
          localStorage.setItem("app_build_time", currentBuildTime);

          // 少し遅延してからハードリロード
          setTimeout(() => {
            window.location.href = window.location.href;
          }, 500);

          return;
        }

        // 初回アクセスまたは同じビルドの場合、ビルド時刻を保存
        if (currentBuildTime) {
          localStorage.setItem("app_build_time", currentBuildTime);
        }
      } catch {
        // デプロイメントチェック中のエラー処理
      }
    };

    // キャッシュをクリアする関数
    const clearAllCaches = async () => {
      if ("caches" in window) {
        try {
          const cacheNames = await caches.keys();
          const deletePromises = cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          });

          await Promise.all(deletePromises);
        } catch {
          // キャッシュクリア失敗時の処理
        }
      }
    };

    // 404エラーが発生している場合の緊急クリア
    const handleResourceErrors = () => {
      let errorCount = 0;
      const maxErrors = 3; // 3回連続で404エラーが発生したら強制リロード

      const errorHandler = (event: Event) => {
        const target = event.target as HTMLElement;
        if (
          target &&
          (target.tagName === "LINK" || target.tagName === "SCRIPT")
        ) {
          errorCount++;

          if (errorCount >= maxErrors) {
            clearAllCaches().then(() => {
              setTimeout(() => {
                window.location.href = window.location.href;
              }, 1000);
            });
          }
        }
      };

      // エラーイベントをリッスン
      window.addEventListener("error", errorHandler, true);

      // クリーンアップ
      return () => {
        window.removeEventListener("error", errorHandler, true);
      };
    };

    // チェックを実行
    checkForUpdates();

    // リソースエラーハンドラーを設定
    const cleanup = handleResourceErrors();

    return cleanup;
  }, []);

  return null;
}
