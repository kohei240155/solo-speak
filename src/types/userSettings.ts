import { z } from "zod";
import { LanguageInfo } from "./common";

// バリデーションスキーマ
export const userSetupSchema = z.object({
	username: z.string().min(1, "Display Name is required"),
	iconUrl: z.string().optional(),
	nativeLanguageId: z.string().min(1, "Native Language is required"),
	defaultLearningLanguageId: z
		.string()
		.min(1, "Default Learning Language is required"),
	email: z.string().email("Please enter a valid email address"),
});

export type UserSetupFormData = z.infer<typeof userSetupSchema>;

// 再エクスポート（後方互換性のため）
export type Language = LanguageInfo;

// ユーザー設定APIレスポンス型（サーバーサイドと共用）
export interface UserSettingsResponse {
	iconUrl?: string | null;
	username?: string | null;
	nativeLanguageId?: string | null;
	defaultLearningLanguageId?: string | null;
	nativeLanguage?: { id: string; name: string; code: string } | null;
	defaultLearningLanguage?: { id: string; name: string; code: string } | null;
	email?: string | null;
}

// ユーザー設定更新リクエスト型
export interface UserSettingsUpdateRequest {
	username?: string;
	iconUrl?: string;
	nativeLanguageId?: string;
	defaultLearningLanguageId?: string;
	email?: string;
}

// ユーザー設定作成リクエスト型
export interface UserSettingsCreateRequest extends UserSettingsUpdateRequest {
	email: string;
}
