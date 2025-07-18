# API共通関数ドキュメント

## 概要
このドキュメントでは、APIエンドポイントで共通して使用できる関数について説明します。

## ファイル構成

### `/src/utils/api-helpers.ts`
APIリクエストの共通処理を提供します。

#### 主な関数
- `authenticateRequest(request: NextRequest)`: 認証処理
- `validateUsername(username: string)`: ユーザー名のバリデーション
- `validateEmail(email: string)`: メールアドレスのバリデーション
- `validateBirthdate(birthdate: string)`: 生年月日のバリデーション
- `validateRequiredFields(data: Record<string, unknown>, requiredFields: string[])`: 必須フィールドのバリデーション
- `createErrorResponse(error: unknown, context: string)`: エラーレスポンス作成
- `createLanguageFallbackResponse(isError: boolean)`: 言語データのフォールバック処理

### `/src/utils/prisma.ts`
Prismaクライアントの共通設定を提供します。

#### 主な機能
- シングルトンパターンでPrismaクライアントを提供
- 開発環境と本番環境で異なる設定を適用
- 適切なログレベルの設定

### `/src/utils/database-helpers.ts`
データベース操作の共通処理を提供します。

#### 主な関数
- `checkUsernameConflict(username: string, excludeUserId?: string)`: ユーザー名の重複チェック
- `checkUserExists(userId: string)`: ユーザーの存在チェック
- `getUserSettings(userId: string)`: ユーザー設定の取得
- `createUserSettings(user: User, userData: {...})`: ユーザー設定の作成
- `updateUserSettings(userId: string, userData: {...})`: ユーザー設定の更新

## 使用例

### 基本的な認証付きAPIエンドポイント

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse } from '@/utils/api-helpers'
import { prisma } from '@/utils/prisma'

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    // データベース処理
    const data = await prisma.someModel.findMany({
      where: { userId: authResult.user.id }
    })

    return NextResponse.json(data)
  } catch (error) {
    return createErrorResponse(error, 'GET /api/your-endpoint')
  }
}
```

### バリデーション付きAPIエンドポイント

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { 
  authenticateRequest, 
  validateUsername, 
  validateEmail, 
  validateRequiredFields,
  createErrorResponse 
} from '@/utils/api-helpers'

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const body = await request.json()
    
    // 必須フィールドのバリデーション
    const requiredValidation = validateRequiredFields(body, ['username', 'email'])
    if (!requiredValidation.isValid) {
      return NextResponse.json({ error: requiredValidation.error }, { status: 400 })
    }

    // 個別フィールドのバリデーション
    const usernameValidation = validateUsername(body.username)
    if (!usernameValidation.isValid) {
      return NextResponse.json({ error: usernameValidation.error }, { status: 400 })
    }

    const emailValidation = validateEmail(body.email)
    if (!emailValidation.isValid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 })
    }

    // データベース処理
    // ...

    return NextResponse.json({ success: true })
  } catch (error) {
    return createErrorResponse(error, 'POST /api/your-endpoint')
  }
}
```

## 注意事項

1. **認証**: すべてのAPIエンドポイントで `authenticateRequest` を使用して認証を行ってください
2. **エラーハンドリング**: `createErrorResponse` を使用して一貫したエラーレスポンスを返してください
3. **バリデーション**: 適切なバリデーション関数を使用してデータの整合性を保ってください
4. **Prismaクライアント**: 直接インスタンスを作成せず、`/src/utils/prisma.ts` からインポートしてください

## 型定義

共通関数では以下の型を使用します：

- `NextRequest`, `NextResponse`: Next.jsのリクエスト/レスポンス型
- `User`: Supabaseのユーザー型
- `Gender`: Prismaで生成される性別の列挙型

## 今後の拡張

新しい共通処理が必要になった場合は、以下のガイドラインに従って追加してください：

1. 機能別にファイルを分割する
2. 適切な型定義を提供する
3. エラーハンドリングを含める
4. ドキュメントを更新する
