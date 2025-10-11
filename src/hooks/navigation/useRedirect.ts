import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";

/**
 * リダイレクトフック
 * 認証済みかつセットアップ完了ユーザーを指定されたパスにリダイレクトする
 *
 * @param redirectPath - リダイレクト先のパス（デフォルト: '/phrase/list'）
 * @param condition - リダイレクト条件（デフォルト: 認証済み且つセットアップ完了）
 */
export const useRedirect = (
  redirectPath = "/phrase/list",
  condition?: (
    user: User | null,
    isUserSetupComplete: boolean,
    loading: boolean,
  ) => boolean,
) => {
  const { user, loading, isUserSetupComplete } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // ローディング中は何もしない
    if (loading) return;

    // カスタム条件が指定されている場合はそれを使用、そうでなければデフォルト条件
    const shouldRedirect = condition
      ? condition(user, isUserSetupComplete, loading)
      : !loading && user && isUserSetupComplete;

    if (shouldRedirect) {
      router.push(redirectPath);
    }
  }, [loading, user, isUserSetupComplete, router, redirectPath, condition]);

  return {
    user,
    loading,
    isUserSetupComplete,
    isAuthenticated: !!user && !loading,
  };
};
