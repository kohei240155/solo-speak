import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { userSetupCache } from "@/utils/userSetupCache";

/**
 * 認証ガードフック
 * ログインしていないユーザーをホームページにリダイレクトし、
 * ユーザーデータがDBに存在しない場合はSettings画面にリダイレクトする
 *
 * @param redirectPath - 未ログイン時のリダイレクト先のパス（デフォルト: '/'）
 * @param requireUserSetup - ユーザー設定完了を必須とするか（デフォルト: true）
 * @returns 認証状態と読み込み状態
 */
export const useAuthGuard = (redirectPath = "/", requireUserSetup = true) => {
  const {
    user,
    loading,
    userSettings,
    userSettingsLoading,
    isUserSetupComplete,
  } = useAuth();
  const router = useRouter();
  const hasRedirectedToSettings = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // ローディング中は何もしない
    if (loading || userSettingsLoading) return;

    // ユーザーがログインしていない場合、指定されたパスにリダイレクト
    if (!user) {
      router.push(redirectPath);
      return;
    }

    // PWA対応: ユーザー設定がnullの場合、キャッシュを確認してから判定
    if (
      requireUserSetup &&
      userSettings === null &&
      !hasRedirectedToSettings.current
    ) {
      const currentPath = window.location.pathname;

      // 既にSettings画面にいる場合はリダイレクトしない
      if (currentPath === "/settings") {
        return;
      }

      // キャッシュから設定完了状態を確認
      const cachedSetupStatus = userSetupCache.getUserSetupComplete(user.id);

      // キャッシュで設定完了が確認できる場合はリダイレクトしない
      if (cachedSetupStatus === true) {
        return;
      }

      // PWA環境での初回データ取得を考慮して、少し待ってから判定
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        // 1.5秒後にまだnullで、キャッシュでも未完了の場合のみSettings画面にリダイレクト
        if (
          userSettings === null &&
          !userSettingsLoading &&
          !hasRedirectedToSettings.current
        ) {
          const latestCachedStatus = userSetupCache.getUserSetupComplete(
            user.id,
          );
          if (latestCachedStatus !== true) {
            hasRedirectedToSettings.current = true;
            router.push("/settings");
          }
        }
      }, 1500);
    }

    // userSettingsが取得できた場合はタイムアウトをクリア
    if (userSettings !== null && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      hasRedirectedToSettings.current = false;
    }

    // クリーンアップ
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    user,
    loading,
    userSettings,
    userSettingsLoading,
    router,
    redirectPath,
    requireUserSetup,
  ]);

  return {
    user,
    loading,
    isAuthenticated: !!user && !loading,
    isUserSetupComplete,
    userSettingsLoading,
  };
};
