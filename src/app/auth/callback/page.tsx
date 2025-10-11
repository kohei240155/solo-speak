"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/spabase";
import { api } from "@/utils/api";
import { UserSettingsResponse } from "@/types/userSettings";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function AuthCallback() {
  const router = useRouter();
  const [checkingUserStatus, setCheckingUserStatus] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Authenticating...");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URLパラメータから認証コードを処理
        const { data: authData, error: authError } =
          await supabase.auth.getSession();

        if (authError) {
          router.push("/?error=callback_error");
          return;
        }

        if (authData.session) {
          // 認証成功後、ユーザーデータの存在をチェック
          setStatusMessage("Authenticating...");

          try {
            // ユーザー設定を取得してユーザーがDBに存在するかチェック
            await api.get<UserSettingsResponse>("/api/user/settings", {
              showErrorToast: false,
            });

            // ユーザーデータが存在する場合はPhrase List画面に遷移
            setTimeout(() => {
              router.replace("/phrase/list");
            }, 100);
          } catch {
            // ユーザーが存在しない場合はSettings画面に遷移
            setTimeout(() => {
              router.replace("/settings");
            }, 100);
          }
        } else {
          // セッション情報がない場合はホームページへ
          router.push("/");
        }
      } catch {
        router.push("/?error=callback_error");
      } finally {
        setCheckingUserStatus(false);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex justify-center items-start bg-gray-50 pt-28">
      <LoadingSpinner
        message={checkingUserStatus ? statusMessage : "Authenticating..."}
      />
    </div>
  );
}
