import { Language } from "@/types/phrase";

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

	return (
		<div className="relative">
			<select
				value={learningLanguage}
				onChange={(e) => onLanguageChange(e.target.value)}
				className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-1 pr-10 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px] md:min-w-[160px] text-gray-900"
			>
				{availableLanguages.map((lang) => (
					<option key={lang.code} value={lang.code}>
						{lang.name}
					</option>
				))}
			</select>
			<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
				<svg
					className="fill-current h-5 w-5"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
				>
					<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
				</svg>
			</div>
		</div>
	);
}
