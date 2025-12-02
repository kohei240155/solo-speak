// 翻訳関連の共通型定義とユーティリティ
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "@/constants/languages";

export interface TranslationData {
	[key: string]: string | TranslationData;
}

export interface TranslationOptions {
	returnObjects?: boolean;
	[key: string]: string | number | boolean | undefined;
}

/**
 * ネストしたキーから翻訳値を取得する共通関数（オーバーロード）
 */
export function getNestedTranslation(
	translations: TranslationData,
	key: string,
	options: TranslationOptions & { returnObjects: true },
): string[] | TranslationData;
export function getNestedTranslation(
	translations: TranslationData,
	key: string,
	options?: TranslationOptions,
): string;
export function getNestedTranslation(
	translations: TranslationData,
	key: string,
	options?: TranslationOptions,
): string | string[] | TranslationData {
	const keys = key.split(".");
	let value: string | TranslationData = translations;

	for (const k of keys) {
		if (value && typeof value === "object" && k in value) {
			value = value[k];
		} else {
			// キーが見つからない場合はキーをそのまま返す
			return key;
		}
	}

	// returnObjects: true の場合、配列やオブジェクトをそのまま返す
	if (options?.returnObjects) {
		if (Array.isArray(value)) {
			return value;
		}
		if (typeof value === "object" && value !== null) {
			return value as TranslationData;
		}
	}

	if (typeof value !== "string") {
		return key;
	}

	// シンプルな変数置換（{{variable}}形式と{variable}形式の両方をサポート）
	if (options) {
		// {{variable}}形式の置換
		value = value.replace(
			/\{\{(\w+)\}\}/g,
			(match: string, varName: string) => {
				return String(options[varName] || match);
			},
		);

		// {variable}形式の置換（i18next形式）
		value = value.replace(/\{(\w+)\}/g, (match: string, varName: string) => {
			return String(options[varName] || match);
		});
	}

	return value;
}

/**
 * Accept-Languageヘッダーから言語を取得
 * @param acceptLanguage Accept-Languageヘッダーの値
 * @returns 言語コード
 */
export function getLocaleFromAcceptLanguage(acceptLanguage: string): string {
	if (!acceptLanguage) {
		return DEFAULT_LANGUAGE;
	}

	// 最初に出現するサポート言語を返す（シンプルな処理）
	for (const supportedLang of SUPPORTED_LANGUAGES) {
		if (acceptLanguage.includes(supportedLang)) {
			return supportedLang;
		}
	}

	return DEFAULT_LANGUAGE;
}
