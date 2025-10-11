import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/utils/api-helpers";
import { createErrorResponse } from "@/utils/api-helpers";
import { prisma } from "@/utils/prisma";
import { createServerSupabaseClient } from "@/utils/supabase-server";

// ユーザー退会（物理削除）
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if ("error" in authResult) {
      return authResult.error;
    }

    const userId = authResult.user.id;

    // ユーザー情報を取得してアイコンURLを確認
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { iconUrl: true },
    });

    // トランザクションでユーザーに関連するすべてのデータを物理削除
    await prisma.$transaction(async (tx) => {
      // SpeakLogを物理削除
      await tx.speakLog.deleteMany({
        where: {
          phrase: {
            userId: userId,
          },
        },
      });

      // QuizResultを物理削除
      await tx.quizResult.deleteMany({
        where: {
          phrase: {
            userId: userId,
          },
        },
      });

      // Phraseを物理削除
      await tx.phrase.deleteMany({
        where: {
          userId: userId,
        },
      });

      // Situationを物理削除
      await tx.situation.deleteMany({
        where: {
          userId: userId,
        },
      });

      // 最後にUserを物理削除
      await tx.user.delete({
        where: {
          id: userId,
        },
      });
    });

    // Supabaseストレージからアイコン画像を削除
    if (user?.iconUrl && user.iconUrl.includes("supabase")) {
      try {
        // サーバー用Supabaseクライアントを作成（管理者権限）
        const supabaseAdmin = createServerSupabaseClient();

        // URLからファイルパスを抽出
        const url = new URL(user.iconUrl);
        const pathParts = url.pathname
          .split("/")
          .filter((part) => part.length > 0);

        // /storage/v1/object/public/images/user-icons/filename.png の構造から
        // バケット名とファイルパスを抽出
        const publicIndex = pathParts.findIndex((part) => part === "public");

        if (publicIndex !== -1 && pathParts.length > publicIndex + 2) {
          const bucketName = pathParts[publicIndex + 1]; // 'images'
          const filePath = pathParts.slice(publicIndex + 2).join("/"); // 'user-icons/filename.png'

          const { error: deleteError } = await supabaseAdmin.storage
            .from(bucketName)
            .remove([filePath]);

          if (deleteError) {
            console.error("Failed to delete icon from storage:", deleteError);
            // ストレージ削除エラーは退会処理を止めない
          }
        }
      } catch (storageError) {
        console.error("Error processing icon deletion:", storageError);
        // ストレージ削除エラーは退会処理を止めない
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("User withdrawal error:", error);
    return createErrorResponse(error);
  }
}
