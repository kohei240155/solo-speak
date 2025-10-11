import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, createErrorResponse } from "@/utils/api-helpers";
import { downloadAndUploadGoogleAvatar } from "@/utils/storage";

/** * Googleアバター画像をSupabase StorageにアップロードするAPIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns { iconUrl: string, message: string } - アップロードされたアバター画像のURLとメッセージ
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if ("error" in authResult) {
      return authResult.error;
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const { googleAvatarUrl } = body;

    if (!googleAvatarUrl) {
      return NextResponse.json(
        { error: "Google avatar URL is required" },
        { status: 400 },
      );
    }

    // Google画像URLのバリデーション
    if (
      !googleAvatarUrl.includes("googleusercontent.com") &&
      !googleAvatarUrl.includes("googleapis.com") &&
      !googleAvatarUrl.includes("google.com")
    ) {
      return NextResponse.json(
        {
          error: "Invalid Google avatar URL",
        },
        { status: 400 },
      );
    }

    // Google画像をダウンロードしてSupabase Storageにアップロード
    // APIルートでは認証済みなので、セッション情報は不要
    const publicUrl = await downloadAndUploadGoogleAvatar(
      googleAvatarUrl,
      authResult.user.id,
    );

    return NextResponse.json({
      iconUrl: publicUrl,
      message: "Google avatar uploaded successfully",
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
