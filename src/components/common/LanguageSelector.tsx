import { Language } from "@/types/phrase";
import CustomSelect from "./CustomSelect";

interface LanguageSelectorProps {
	learningLanguage: string | undefined;
	onLanguageChange: (language: string) => void;
	languages: Language[];
	nativeLanguage: string;
}

export default function LanguageSelector({
	learningLanguage,
	onLanguageChange,
	languages,
	nativeLanguage,
}: LanguageSelectorProps) {
	// 利用可能な言語を母国語以外にフィルタリング
	const availableLanguages = languages.filter(
		(lang) => lang.code !== nativeLanguage,
	);

	// 現在選択されている言語が利用可能かチェック
	const isValidLanguage = availableLanguages.some(
		(lang) => lang.code === learningLanguage,
	);

	// 不正な言語の場合は表示しない
	if (
		!learningLanguage ||
		!isValidLanguage ||
		availableLanguages.length === 0
	) {
		return null;
	}

	// CustomSelect用のオプションを生成
	const options = availableLanguages.map((lang) => ({
		value: lang.code,
		label: lang.name,
	}));

	return (
		<CustomSelect
			value={learningLanguage}
			options={options}
			onChange={onLanguageChange}
			size="lg"
		/>
	);
}
