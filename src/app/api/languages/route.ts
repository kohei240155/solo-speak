import { NextResponse } from "next/server";
import { createErrorResponse } from "@/utils/api-helpers";
import { prisma } from "@/utils/prisma";
import { LanguagesResponseData } from "@/types/language";

export async function GET() {
	try {
		// 言語リストは認証なしでアクセス可能
		const languages: LanguagesResponseData = await prisma.language.findMany({
			where: {
				deletedAt: null,
			},
			orderBy: {
				name: "asc",
			},
		});

		if (languages.length === 0) {
			return createErrorResponse(new Error("No languages found in database"));
		}

		return NextResponse.json(languages);
	} catch (error) {
		// データベースエラーの場合、共通のエラーレスポンスを返す
		return createErrorResponse(error);
	}
}
