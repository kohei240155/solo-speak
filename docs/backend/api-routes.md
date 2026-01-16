# APIルート実装パターン

## 共通仕様

### 認証

```typescript
// すべてのAPIでauthenticateRequest()を使用
import { authenticateRequest } from "@/utils/api-helpers";

const authResult = await authenticateRequest(request);
if ("error" in authResult) {
  return authResult.error;  // 401 Unauthorized
}
const userId = authResult.user.id;
```

### リクエストヘッダー

```
Authorization: Bearer <jwt_token>
Accept-Language: ja  # エラーメッセージのローカライズ
Content-Type: application/json
```

---

## 基本テンプレート

**ファイル**: `src/app/api/[resource]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/utils/api-helpers";
import { prisma } from "@/utils/prisma";
import { ApiErrorResponse } from "@/types/api";

// 1. Zodスキーマを定義
const createResourceSchema = z.object({
  name: z.string().min(1).max(100),
  // 他のフィールド...
});

// 2. POSTハンドラー
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 3. 認証チェック
    const authResult = await authenticateRequest(request);
    if ("error" in authResult) {
      return authResult.error;
    }
    const userId = authResult.user.id;

    // 4. リクエストボディのパース・バリデーション
    const body: unknown = await request.json();
    const parsed = createResourceSchema.parse(body);

    // 5. データベース操作
    const result = await prisma.resource.create({
      data: {
        userId,
        ...parsed,
      },
    });

    // 6. レスポンス
    return NextResponse.json({ success: true, data: result }, { status: 201 });

  } catch (error) {
    // 7. エラーハンドリング
    if (error instanceof z.ZodError) {
      const errorResponse: ApiErrorResponse = {
        error: "Invalid request data",
        details: error.issues,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const errorResponse: ApiErrorResponse = {
      error: "Internal server error",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// 8. GETハンドラー
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await authenticateRequest(request);
    if ("error" in authResult) {
      return authResult.error;
    }

    // クエリパラメータの取得
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // 並列クエリでパフォーマンス向上
    const [items, total] = await Promise.all([
      prisma.resource.findMany({
        where: {
          userId: authResult.user.id,
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.resource.count({
        where: {
          userId: authResult.user.id,
          deletedAt: null,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      items,
      pagination: { total, limit, page, hasMore: offset + limit < total },
    });

  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

## 動的ルート

**ファイル**: `src/app/api/[resource]/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: Props
): Promise<NextResponse> {
  const { id } = await params;
  // ...
}
```

---

## i18n対応（ユーザー向けエラーメッセージ）

```typescript
import { getLocaleFromRequest, getTranslation } from "@/utils/api-i18n";

const locale = getLocaleFromRequest(request);
const t = getTranslation(locale);

return NextResponse.json({ error: t("errors.notFound") }, { status: 404 });
```

---

## エラーハンドリング

### 認証エラー（401）

```typescript
const authResult = await authenticateRequest(request);
if ("error" in authResult) {
  return authResult.error;  // NextResponseオブジェクトを直接返す
}
```

### Zodバリデーションエラー（400）

```typescript
import { z } from "zod";
import { ApiErrorResponse } from "@/types/api";

try {
  const body: unknown = await request.json();
  const parsed = schema.parse(body);
} catch (error) {
  if (error instanceof z.ZodError) {
    const errorResponse: ApiErrorResponse = {
      error: "Invalid request data",
      details: error.issues,
    };
    return NextResponse.json(errorResponse, { status: 400 });
  }
}
```

### リソース存在確認エラー（404）

```typescript
const resource = await prisma.resource.findUnique({
  where: { id: resourceId },
});

if (!resource) {
  const errorResponse: ApiErrorResponse = {
    error: "Resource not found",
  };
  return NextResponse.json(errorResponse, { status: 404 });
}
```

### 権限エラー（403）

```typescript
if (resource.userId !== authResult.user.id) {
  return NextResponse.json(
    { error: "Access denied" },
    { status: 403 }
  );
}
```

### サーバーエラー（500）

```typescript
catch (error) {
  const errorResponse: ApiErrorResponse = {
    error: "Internal server error",
    details: error instanceof Error ? error.message : "Unknown error",
  };
  return NextResponse.json(errorResponse, { status: 500 });
}
```

---

## レスポンス形式

### 成功レスポンス

```typescript
// 単一リソース作成（201）
return NextResponse.json(
  { success: true, data: createdResource },
  { status: 201 }
);

// リスト取得（200）
return NextResponse.json({
  success: true,
  items: resources,
  pagination: {
    total: 100,
    limit: 10,
    page: 1,
    hasMore: true,
  },
});
```

### エラーレスポンス

```typescript
interface ApiErrorResponse {
  error: string;        // エラーメッセージ
  details?: unknown;    // Zodエラー時はissues配列
}
```

---

## HTTPステータスコード

| ステータス | 使用場面 | 例 |
|----------|--------|-----|
| 200 | GET成功 | フレーズ一覧取得 |
| 201 | POST成功（リソース作成） | フレーズ作成 |
| 400 | バリデーションエラー | Zod検証失敗、必須フィールド不足 |
| 401 | 認証失敗 | トークンなし、無効なトークン |
| 403 | 権限なし | 他ユーザーのリソースへのアクセス |
| 404 | リソース不存在 | フレーズID不存在 |
| 500 | サーバーエラー | 予期しないエラー |
| 503 | サービス利用不可 | 認証サービス停止 |

---

## 実装例（参照用）

| ファイル | 説明 |
|----------|------|
| `src/app/api/phrase/route.ts` | フレーズ一覧・作成（GET/POST） |
| `src/app/api/phrase/[id]/route.ts` | フレーズ更新・削除（PUT/DELETE） |
| `src/app/api/phrase/generate/route.ts` | AIフレーズ生成 |
| `src/app/api/phrase/random-generate/route.ts` | AIランダムフレーズ生成 |
| `src/app/api/ranking/speech/add/route.ts` | ランキング取得 |

---

## 関連ファイル

| ファイル | 説明 |
|----------|------|
| `src/utils/api-helpers.ts` | `authenticateRequest()`, `validateUsername()` 等 |
| `src/utils/api-i18n.ts` | `getLocaleFromRequest()`, `getTranslation()` |
| `src/types/api.ts` | `ApiErrorResponse` 等 |
| `src/utils/prisma.ts` | Prismaクライアント |
