import { prisma } from "@/utils/prisma";
import { User } from "@supabase/supabase-js";
import { getInitialSituations } from "@/data/situations";
import {
	UserSettingsResponse,
	UserSettingsUpdateRequest,
	UserSettingsCreateRequest,
} from "@/types/userSettings";

/**
 * ユーザーの存在チェック
 * @param userId ユーザーID
 * @returns ユーザーが存在するかどうか
 */
export async function checkUserExists(userId: string): Promise<boolean> {
	try {
		const user = await prisma.user.findUnique({
			where: {
				id: userId,
				deletedAt: null, // 削除されていないユーザーのみ確認
			},
		});
		const exists = !!user;
		return exists;
	} catch (error) {
		throw error;
	}
}

/**
 * ユーザー設定の取得
 * @param userId ユーザーID
 * @returns ユーザー設定データ
 */
export async function getUserSettings(
	userId: string,
): Promise<UserSettingsResponse | null> {
	const user = await prisma.user.findUnique({
		where: {
			id: userId,
			deletedAt: null, // 削除されていないユーザーのみ取得
		},
		include: {
			nativeLanguage: true,
			defaultLearningLanguage: true,
		},
	});

	if (!user) {
		return null;
	}

	return {
		iconUrl: user.iconUrl,
		username: user.username,
		nativeLanguageId: user.nativeLanguageId,
		defaultLearningLanguageId: user.defaultLearningLanguageId,
		email: user.email,
		timezone: user.timezone,
		phraseMode: user.phraseMode,
		practiceIncludeExisting: user.practiceIncludeExisting,
		practiceStartDate: user.practiceStartDate?.toISOString() || null,
		nativeLanguage: user.nativeLanguage
			? {
					id: user.nativeLanguage.id,
					name: user.nativeLanguage.name,
					code: user.nativeLanguage.code,
				}
			: null,
		defaultLearningLanguage: user.defaultLearningLanguage
			? {
					id: user.defaultLearningLanguage.id,
					name: user.defaultLearningLanguage.name,
					code: user.defaultLearningLanguage.code,
				}
			: null,
	};
}

/**
 * ユーザー設定の作成
 * @param user Supabaseユーザー情報
 * @param userData ユーザーデータ
 * @returns 作成されたユーザー設定
 */
export async function createUserSettings(
	user: User,
	userData: UserSettingsCreateRequest,
): Promise<UserSettingsResponse> {
	try {
		// iconUrlが空の場合はデフォルト画像を設定
		const iconUrl = userData.iconUrl || "/images/user-icon/user-icon.png";

		const result = await prisma.user.create({
			data: {
				id: user.id,
				email: user.email || userData.email || "",
				username: userData.username,
				iconUrl: iconUrl,
				nativeLanguageId: userData.nativeLanguageId,
				defaultLearningLanguageId: userData.defaultLearningLanguageId,
				timezone: userData.timezone || "UTC",
				phraseMode: userData.phraseMode || "practice",
				practiceIncludeExisting: userData.practiceIncludeExisting ?? true,
			},
			include: {
				nativeLanguage: true,
				defaultLearningLanguage: true,
			},
		});

		// ユーザー作成後、ネイティブ言語に応じたデフォルトシチュエーションを作成
		try {
			if (result.nativeLanguage) {
				await createDefaultSituationsForUser(
					prisma,
					result.id,
					result.nativeLanguage.code,
				);
			}
		} catch {
			// シチュエーション作成に失敗してもユーザー作成自体は成功として扱う
		}

		return {
			iconUrl: result.iconUrl,
			username: result.username,
			nativeLanguageId: result.nativeLanguageId,
			defaultLearningLanguageId: result.defaultLearningLanguageId,
			email: result.email,
			timezone: result.timezone,
			phraseMode: result.phraseMode,
			practiceIncludeExisting: result.practiceIncludeExisting,
			practiceStartDate: result.practiceStartDate?.toISOString() || null,
			nativeLanguage: result.nativeLanguage
				? {
						id: result.nativeLanguage.id,
						name: result.nativeLanguage.name,
						code: result.nativeLanguage.code,
					}
				: null,
			defaultLearningLanguage: result.defaultLearningLanguage
				? {
						id: result.defaultLearningLanguage.id,
						name: result.defaultLearningLanguage.name,
						code: result.defaultLearningLanguage.code,
					}
				: null,
		};
	} catch (error) {
		throw error;
	}
}

/**
 * ユーザーのシチュエーションが存在するかチェック
 * @param userId ユーザーID
 * @returns シチュエーションが存在するかどうか
 */
export async function hasUserSituations(userId: string): Promise<boolean> {
	const count = await prisma.situation.count({
		where: {
			userId,
			deletedAt: null,
		},
	});
	return count > 0;
}

/**
 * ユーザー設定の更新
 * @param userId ユーザーID
 * @param userData 更新データ
 * @returns 更新されたユーザー設定
 */
export async function updateUserSettings(
	userId: string,
	userData: UserSettingsUpdateRequest,
): Promise<UserSettingsResponse> {
	const result = await prisma.user.update({
		where: {
			id: userId,
			deletedAt: null, // 削除されていないユーザーのみ更新
		},
		data: {
			username: userData.username,
			iconUrl: userData.iconUrl,
			nativeLanguageId: userData.nativeLanguageId,
			defaultLearningLanguageId: userData.defaultLearningLanguageId,
			timezone: userData.timezone,
			phraseMode: userData.phraseMode,
			practiceIncludeExisting: userData.practiceIncludeExisting,
		},
		include: {
			nativeLanguage: true,
			defaultLearningLanguage: true,
		},
	});

	// ユーザーにシチュエーションが存在しない場合、デフォルトシチュエーションを作成
	try {
		const hasSituations = await hasUserSituations(userId);
		if (!hasSituations && result.nativeLanguage) {
			await createDefaultSituationsForUser(
				prisma,
				userId,
				result.nativeLanguage.code,
			);
		}
	} catch {
		// シチュエーション作成に失敗してもユーザー更新自体は成功として扱う
	}

	return {
		iconUrl: result.iconUrl,
		username: result.username,
		nativeLanguageId: result.nativeLanguageId,
		defaultLearningLanguageId: result.defaultLearningLanguageId,
		email: result.email,
		timezone: result.timezone,
		phraseMode: result.phraseMode,
		practiceIncludeExisting: result.practiceIncludeExisting,
		practiceStartDate: result.practiceStartDate?.toISOString() || null,
		nativeLanguage: result.nativeLanguage
			? {
					id: result.nativeLanguage.id,
					name: result.nativeLanguage.name,
					code: result.nativeLanguage.code,
				}
			: null,
		defaultLearningLanguage: result.defaultLearningLanguage
			? {
					id: result.defaultLearningLanguage.id,
					name: result.defaultLearningLanguage.name,
					code: result.defaultLearningLanguage.code,
				}
			: null,
	};
}

/**
 * ユーザーのデフォルトシチュエーションを作成
 * @param prisma Prismaクライアント
 * @param userId ユーザーID
 * @param languageCode ユーザーのネイティブ言語コード
 */
async function createDefaultSituationsForUser(
	prisma: typeof import("@/utils/prisma").prisma,
	userId: string,
	languageCode: string,
): Promise<void> {
	const defaultSituations = getInitialSituations(languageCode);

	// 既存のシチュエーションをチェック（重複作成を防ぐ）
	const existingSituations = await prisma.situation.findMany({
		where: {
			userId,
			deletedAt: null,
		},
	});

	// 既存のシチュエーション名を取得
	const existingNames = existingSituations.map((s) => s.name);

	// 重複しないシチュエーションのみを作成
	const situationsToCreate = defaultSituations.filter(
		(name) => !existingNames.includes(name),
	);

	if (situationsToCreate.length > 0) {
		await prisma.situation.createMany({
			data: situationsToCreate.map((name) => ({
				userId,
				name,
			})),
		});
	}
}
