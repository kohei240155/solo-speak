import { NextRequest, NextResponse } from "next/server";
import {
	authenticateRequest,
	validateUsername,
	validateEmail,
	validateRequiredFields,
	createErrorResponse,
} from "@/utils/api-helpers";
import {
	getUserSettings,
	createUserSettings,
	updateUserSettings,
	checkUserExists,
} from "@/utils/database-helpers";
import { prisma } from "@/utils/prisma";
import { ApiErrorResponse } from "@/types/api";
import { isValidTimezone } from "@/utils/timezone";

// ユーザー設定取得
export async function GET(request: NextRequest) {
	try {
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		const userSettings = await getUserSettings(authResult.user.id);

		if (!userSettings) {
			const errorResponse: ApiErrorResponse = {
				error: "User not found",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		// ユーザー切り替え対応のためキャッシュを無効化
		const response = NextResponse.json(userSettings);
		response.headers.set(
			"Cache-Control",
			"no-cache, no-store, must-revalidate",
		);
		response.headers.set("Pragma", "no-cache");
		response.headers.set("Expires", "0");
		return response;
	} catch (error) {
		return createErrorResponse(error);
	}
}

// ユーザー設定登録
export async function POST(request: NextRequest) {
	try {
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		const body = await request.json();

		const {
			username,
			iconUrl,
			nativeLanguageId,
			defaultLearningLanguageId,
			email,
			timezone,
			phraseMode,
			practiceIncludeExisting,
		} = body;

		// 必須フィールドのバリデーション
		const requiredValidation = validateRequiredFields(body, [
			"username",
			"nativeLanguageId",
			"defaultLearningLanguageId",
		]);
		if (!requiredValidation.isValid) {
			const errorResponse: ApiErrorResponse = {
				error: requiredValidation.error || "Required fields validation failed",
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		// タイムゾーンのバリデーション
		if (timezone && !isValidTimezone(timezone)) {
			const errorResponse: ApiErrorResponse = {
				error: "Invalid timezone format",
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		// 言語IDの存在確認
		try {
			const [nativeLanguage, learningLanguage] = await Promise.all([
				prisma.language.findUnique({
					where: {
						id: nativeLanguageId,
						deletedAt: null, // 削除されていない言語のみ
					},
				}),
				prisma.language.findUnique({
					where: {
						id: defaultLearningLanguageId,
						deletedAt: null, // 削除されていない言語のみ
					},
				}),
			]);

			if (!nativeLanguage) {
				return NextResponse.json(
					{
						error: "Invalid native language selection. Please select a valid language.",
					},
					{ status: 400 },
				);
			}

			if (!learningLanguage) {
				return NextResponse.json(
					{
						error: "Invalid learning language selection. Please select a valid language.",
					},
					{ status: 400 },
				);
			}
		} catch {
			return NextResponse.json(
				{
					error: "Failed to validate language selection. Please try again.",
				},
				{ status: 500 },
			);
		}

		// ユーザーが既に存在するかチェック
		const existingUser = await checkUserExists(authResult.user.id);

		let result;
		if (existingUser) {
			result = await updateUserSettings(authResult.user.id, {
				username,
				iconUrl,
				nativeLanguageId,
				defaultLearningLanguageId,
				timezone,
				phraseMode,
				practiceIncludeExisting,
			});
		} else {
			result = await createUserSettings(authResult.user, {
				username,
				iconUrl,
				nativeLanguageId,
				defaultLearningLanguageId,
				email,
				timezone,
				phraseMode,
				practiceIncludeExisting,
			});
		}

		return NextResponse.json(result, { status: existingUser ? 200 : 201 });
	} catch (error) {
		return createErrorResponse(error);
	}
}

// ユーザー設定更新
export async function PUT(request: NextRequest) {
	try {
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		const body = await request.json();
		const {
			username,
			iconUrl,
			nativeLanguageId,
			defaultLearningLanguageId,
			email,
			timezone,
			phraseMode,
			practiceIncludeExisting,
		} = body;

		// ユーザー名のバリデーション
		if (username) {
			const usernameValidation = validateUsername(username);
			if (!usernameValidation.isValid) {
				const errorResponse: ApiErrorResponse = {
					error: usernameValidation.error || "Username validation failed",
				};
				return NextResponse.json(errorResponse, { status: 400 });
			}
		}

		// メールアドレスのバリデーション
		if (email) {
			const emailValidation = validateEmail(email);
			if (!emailValidation.isValid) {
				const errorResponse: ApiErrorResponse = {
					error: emailValidation.error || "Email validation failed",
				};
				return NextResponse.json(errorResponse, { status: 400 });
			}
		}

		// タイムゾーンのバリデーション
		if (timezone && !isValidTimezone(timezone)) {
			const errorResponse: ApiErrorResponse = {
				error: "Invalid timezone format",
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		const updatedUser = await updateUserSettings(authResult.user.id, {
			username,
			iconUrl,
			nativeLanguageId,
			defaultLearningLanguageId,
			timezone,
			phraseMode,
			practiceIncludeExisting,
		});

		return NextResponse.json(updatedUser);
	} catch (error) {
		return createErrorResponse(error);
	}
}
