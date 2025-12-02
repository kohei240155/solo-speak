"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
	TranslationData,
	TranslationOptions,
	getNestedTranslation,
} from "@/utils/translation-common";
import { loadTranslation } from "@/utils/translation-loader";

export const useTranslation = (namespace = "app") => {
	const { locale, isLoadingLocale } = useLanguage();
	const [translations, setTranslations] = useState<TranslationData>({});
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (isLoadingLocale) return;

		const loadTranslations = async () => {
			try {
				setIsLoading(true);
				const data = await loadTranslation(locale, namespace);
				setTranslations(data);
			} catch {
				// エラーは無視（loadTranslation内でフォールバック処理済み）
			} finally {
				setIsLoading(false);
			}
		};

		loadTranslations();
	}, [locale, namespace, isLoadingLocale]);

	// 翻訳関数をuseCallbackでメモ化
	const t = useCallback(
		(key: string, options?: TranslationOptions) => {
			return getNestedTranslation(translations, key, options);
		},
		[translations],
	);

	return {
		t: t as {
			(
				key: string,
				options: TranslationOptions & { returnObjects: true },
			): string[] | TranslationData;
			(key: string, options?: TranslationOptions): string;
		},
		locale,
		isLoading,
	};
};
