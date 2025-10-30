"use client";

import { useTranslationPreloader } from "@/hooks/ui/useTranslationPreloader";

/**
 * 翻訳ファイルの事前読み込みを行うコンポーネント
 */
export default function TranslationPreloader() {
	useTranslationPreloader();
	return null; // レンダリングは行わない
}
