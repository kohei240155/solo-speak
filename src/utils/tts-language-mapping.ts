import { TTS_LANGUAGE_MAPPING, DEFAULT_LANGUAGE } from "@/constants/languages";

/**
 * 言語コードからGoogle Cloud Text-to-Speech APIの言語コードにマッピング
 */
export const getGoogleTTSLanguageCode = (languageCode: string): string => {
	return (
		TTS_LANGUAGE_MAPPING[languageCode as keyof typeof TTS_LANGUAGE_MAPPING] ||
		TTS_LANGUAGE_MAPPING[DEFAULT_LANGUAGE]
	);
};

/**
 * 音声の速度やピッチなどのデフォルト設定
 */
export const getLanguageSpecificVoiceSettings = () => {
	// 全ての言語でデフォルト設定を使用
	return {
		speakingRate: 0.9,
		pitch: 0.0,
		ssmlGender: "NEUTRAL" as const,
	};
};
