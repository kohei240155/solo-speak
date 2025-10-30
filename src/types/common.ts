// 共通の基本型定義

// 言語の基本型（最小限の情報）
export interface BaseLanguage {
	id: string;
	name: string;
	code: string;
}

// 完全な言語型（DB構造）
export interface Language extends BaseLanguage {
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
}

// APIレスポンス用の言語型（フロントエンドで使用）
export interface LanguageInfo {
	id: string;
	name: string;
	code: string;
}
