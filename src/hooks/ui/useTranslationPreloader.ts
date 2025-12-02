"use client";

import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { loadTranslation } from "@/utils/translation-loader";

/**
 * アプリケーション起動時に翻訳ファイルを事前読み込みするフック
 */
export const useTranslationPreloader = () => {
	const { locale } = useLanguage();

	useEffect(() => {
		// 現在の言語の翻訳ファイルを事前読み込み
		const preloadCurrentLanguage = async () => {
			try {
				await Promise.all([
					loadTranslation(locale, "landing"),
					loadTranslation(locale, "app"),
				]);
			} catch {
				// エラーは無視（useTranslationで適切にハンドリングされる）
			}
		};

		preloadCurrentLanguage();
	}, [locale]);
};
