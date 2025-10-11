"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStoredDisplayLanguage } from "@/contexts/LanguageContext";
import { isUILanguage } from "@/constants/languages";

/**
 * Settingsページ専用の言語管理フック
 * - 未認証ユーザー: Top画面で選択された言語（ローカルストレージの値）を使用
 * - 認証済みユーザー: ユーザー設定の母国語（UI対応の場合）、そうでなければ英語
 */
export const useSettingsLanguage = () => {
  const { user, userSettings } = useAuth();
  const { setLocale } = useLanguage();

  useEffect(() => {
    if (!user) {
      // 未認証の場合: ローカルストレージから言語を取得して設定
      const storedLanguage = getStoredDisplayLanguage();
      if (storedLanguage && isUILanguage(storedLanguage)) {
        setLocale(storedLanguage);
      } else {
        // ローカルストレージに保存された言語がない場合は日本語を設定
        setLocale("ja");
      }
      return;
    }

    // 認証済みの場合: ユーザー設定がまだロード中なら待機
    if (userSettings === undefined) {
      return;
    }

    // ユーザー設定がある場合
    if (userSettings?.nativeLanguage?.code) {
      const nativeLanguageCode = userSettings.nativeLanguage.code;
      // UI対応言語であればその言語、そうでなければ英語
      const targetLanguage = isUILanguage(nativeLanguageCode)
        ? nativeLanguageCode
        : "en";
      setLocale(targetLanguage);
    } else {
      // ユーザー設定がまだ不完全な場合は、ローカルストレージの値を維持
      const storedLanguage = getStoredDisplayLanguage();
      if (storedLanguage && isUILanguage(storedLanguage)) {
        setLocale(storedLanguage);
      } else {
        setLocale("ja");
      }
    }
  }, [user, userSettings, setLocale]);
};
