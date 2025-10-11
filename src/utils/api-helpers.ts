import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase-server";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/utils/spabase";

/**
 * APIリクエストの認証処理
 * @param request NextRequest オブジェクト
 * @returns 認証されたユーザー情報またはエラーレスポンス
 */
export async function authenticateRequest(
  request: NextRequest,
): Promise<{ user: User } | { error: NextResponse }> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return {
        error: NextResponse.json(
          { error: "Authorization header required" },
          { status: 401 },
        ),
      };
    }

    const token = authHeader.replace("Bearer ", "");

    const serverSupabase = createServerSupabaseClient();

    let authResponse = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        authResponse = await serverSupabase.auth.getUser(token);
        break; // 成功した場合はループを抜ける
      } catch {
        retryCount++;

        if (retryCount >= maxRetries) {
          return {
            error: NextResponse.json(
              { error: "Authentication service unavailable" },
              { status: 503 },
            ),
          };
        }

        // 1秒待ってからリトライ
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (!authResponse) {
      return {
        error: NextResponse.json(
          { error: "Authentication service unavailable" },
          { status: 503 },
        ),
      };
    }

    const {
      data: { user },
      error,
    } = authResponse;

    if (error || !user) {
      return {
        error: NextResponse.json({ error: "Invalid token" }, { status: 401 }),
      };
    }

    return { user };
  } catch {
    return {
      error: NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      ),
    };
  }
}

/**
 * ユーザー名のバリデーション
 * @param username バリデーション対象のユーザー名
 * @returns バリデーション結果
 */
export function validateUsername(username: string): {
  isValid: boolean;
  error?: string;
} {
  if (
    typeof username !== "string" ||
    username.trim().length < 2 ||
    username.trim().length > 50
  ) {
    return {
      isValid: false,
      error: "Display Name must be between 2 and 50 characters",
    };
  }

  const usernameRegex =
    /^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s\-_]+$/;
  if (!usernameRegex.test(username.trim())) {
    return {
      isValid: false,
      error:
        "Display Name can only contain letters, numbers, Japanese characters, spaces, hyphens, and underscores",
    };
  }

  return { isValid: true };
}

/**
 * メールアドレスのバリデーション
 * @param email バリデーション対象のメールアドレス
 * @returns バリデーション結果
 */
export function validateEmail(email: string): {
  isValid: boolean;
  error?: string;
} {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email) || email.length > 254) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  if (email.includes("..") || email.startsWith(".") || email.endsWith(".")) {
    return {
      isValid: false,
      error: "Please enter a valid email address format",
    };
  }

  return { isValid: true };
}

/**
 * 共通のエラーレスポンス作成
 * @param error エラーオブジェクト
 * @param context エラーが発生したコンテキスト
 * @returns エラーレスポンス
 */
export function createErrorResponse(error: unknown): NextResponse {
  return NextResponse.json(
    {
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    },
    { status: 500 },
  );
}

/**
 * 必須フィールドのバリデーション
 * @param data バリデーション対象のデータ
 * @param requiredFields 必須フィールドのリスト
 * @returns バリデーション結果
 */
export function validateRequiredFields(
  data: Record<string, unknown>,
  requiredFields: string[],
): { isValid: boolean; error?: string } {
  const missingFields = requiredFields.filter((field) => !data[field]);

  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: `Required fields: ${missingFields.join(", ")}`,
    };
  }

  return { isValid: true };
}

/**
 * クライアント側でSupabaseの認証トークンを取得
 * @returns 認証トークン（Bearer token形式）またはnull
 */
export async function getClientAuthToken(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ? `Bearer ${session.access_token}` : null;
  } catch {
    return null;
  }
}
