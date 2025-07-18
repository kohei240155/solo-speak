# フレーズ生成機能 開発ガイド

## セットアップ手順

### 1. 環境構築

#### 必要なソフトウェア
- Node.js 18+
- npm または yarn
- PostgreSQL
- Git

#### 環境変数設定
`.env.local` ファイルを作成:
```env
# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# データベース
DATABASE_URL=postgresql://user:password@localhost:5432/solo_speak
DIRECT_URL=postgresql://user:password@localhost:5432/solo_speak

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### パッケージインストール
```bash
npm install --legacy-peer-deps
```

#### データベースセットアップ
```bash
# Prismaマイグレーション
npm run db:migrate:local

# シードデータ投入
npm run db:seed:local
```

### 2. 開発サーバー起動
```bash
npm run dev:local
```

## 開発フロー

### 1. 新機能追加手順

#### ステップ1: ブランチ作成
```bash
git checkout -b feature/new-feature-name
```

#### ステップ2: API開発
```typescript
// src/app/api/new-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const requestSchema = z.object({
  // バリデーション定義
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = requestSchema.parse(body)
    
    // ビジネスロジック
    
    return NextResponse.json(result)
  } catch (error) {
    // エラーハンドリング
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

#### ステップ3: フロントエンド開発
```typescript
// src/app/new-feature/page.tsx
'use client'

import { useState } from 'react'

export default function NewFeaturePage() {
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/new-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error('API error')
      }
      
      const result = await response.json()
      // 成功処理
    } catch (error) {
      // エラー処理
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div>
      {/* UI コンポーネント */}
    </div>
  )
}
```

#### ステップ4: テスト作成
```typescript
// __tests__/api/new-endpoint.test.ts
import { POST } from '@/app/api/new-endpoint/route'

describe('/api/new-endpoint', () => {
  it('should return success response', async () => {
    const request = new Request('http://localhost/api/new-endpoint', {
      method: 'POST',
      body: JSON.stringify({ test: 'data' })
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toHaveProperty('success')
  })
})
```

### 2. コードレビューのポイント

#### セキュリティ
- [ ] 入力値検証が適切に行われているか
- [ ] SQL インジェクション対策
- [ ] XSS対策
- [ ] 認証・認可チェック

#### パフォーマンス
- [ ] 不要なAPI呼び出しがないか
- [ ] データベースクエリが最適化されているか
- [ ] メモリリークの可能性
- [ ] 無限ループの可能性

#### コード品質
- [ ] TypeScript型定義が適切か
- [ ] エラーハンドリングが適切か
- [ ] コメントが適切に記載されているか
- [ ] 命名規則に従っているか

## デバッグ手順

### 1. API デバッグ

#### ログ出力
```typescript
console.log('Debug:', { userId, requestData })
```

#### Postmanでのテスト
```json
POST /api/phrase/generate
{
  "nativeLanguage": "ja",
  "learningLanguage": "en",
  "desiredPhrase": "こんにちは"
}
```

#### ブラウザDevToolsでの確認
1. Network タブでAPI リクエスト確認
2. Console タブでエラーログ確認
3. Application タブでローカルストレージ確認

### 2. データベース デバッグ

#### Prisma Studio
```bash
npm run db:studio:local
```

#### 直接SQLクエリ
```sql
SELECT * FROM phrases WHERE user_id = 'user_123';
```

### 3. フロントエンド デバッグ

#### React DevTools
- Component ツリーの確認
- State の確認
- Props の確認

#### ブラウザDevTools
```typescript
// State デバッグ
console.log('Current state:', { loading, error, data })

// Event デバッグ
const handleClick = (e) => {
  console.log('Click event:', e)
  // 処理
}
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. OpenAI API エラー
```
Error: OpenAI API key is not configured
```
**解決方法**: `.env.local` ファイルに `OPENAI_API_KEY` を設定

#### 2. データベース接続エラー
```
Error: Cannot reach database server
```
**解決方法**: 
- PostgreSQL が起動しているか確認
- `DATABASE_URL` が正しく設定されているか確認

#### 3. Prisma エラー
```
Error: Schema parsing error
```
**解決方法**: 
```bash
npx prisma generate
npx prisma db push
```

#### 4. TypeScript エラー
```
Error: Property does not exist on type
```
**解決方法**: 型定義を確認し、適切な型を設定

#### 5. CORS エラー
```
Access to fetch at '/api/...' has been blocked by CORS policy
```
**解決方法**: Next.js の API Routes では通常発生しないが、外部APIへのアクセス時は適切な設定が必要

## ベストプラクティス

### 1. コード構成

#### ディレクトリ構造
```
src/
├── app/
│   ├── api/                 # API Routes
│   │   ├── phrase/
│   │   │   ├── generate/
│   │   │   └── route.ts
│   │   └── route.ts
│   ├── phrase-generator/    # ページコンポーネント
│   └── page.tsx
├── components/              # 再利用可能コンポーネント
├── contexts/               # React Context
├── utils/                  # ユーティリティ関数
└── types/                  # TypeScript型定義
```

#### 命名規則
- **ファイル名**: kebab-case (`phrase-generator.tsx`)
- **コンポーネント**: PascalCase (`PhraseGenerator`)
- **変数・関数**: camelCase (`handleSubmit`)
- **定数**: UPPER_SNAKE_CASE (`MAX_PHRASE_LENGTH`)

### 2. エラーハンドリング

#### API レベル
```typescript
try {
  // 処理
} catch (error) {
  console.error('API Error:', error)
  
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Invalid input', details: error.issues },
      { status: 400 }
    )
  }
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

#### フロントエンドレベル
```typescript
const [error, setError] = useState('')

try {
  // API呼び出し
} catch (error) {
  setError(error instanceof Error ? error.message : '予期しないエラーが発生しました')
}
```

### 3. パフォーマンス最適化

#### React Hook の効率的な使用
```typescript
// 不要な再レンダリングを防ぐ
const memoizedValue = useMemo(() => {
  return expensiveCalculation(data)
}, [data])

// コールバック関数の最適化
const handleClick = useCallback((id: string) => {
  // 処理
}, [dependency])
```

#### API 呼び出しの最適化
```typescript
// 重複リクエストの防止
const [isLoading, setIsLoading] = useState(false)

const handleSubmit = async () => {
  if (isLoading) return
  
  setIsLoading(true)
  try {
    // API呼び出し
  } finally {
    setIsLoading(false)
  }
}
```

### 4. セキュリティ

#### 入力値検証
```typescript
// Zodスキーマによる検証
const schema = z.object({
  text: z.string().min(1).max(200),
  email: z.string().email()
})
```

#### 認証チェック
```typescript
// API Route での認証確認
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // 処理続行
}
```

## デプロイメント

### 本番環境へのデプロイ手順

#### 1. 環境変数設定
Vercel ダッシュボードで以下を設定:
- `OPENAI_API_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

#### 2. データベースマイグレーション
```bash
npm run db:migrate:production
npm run db:seed:production
```

#### 3. ビルド確認
```bash
npm run build:production
```

#### 4. デプロイ
```bash
git push origin main
```

### ステージング環境での確認

#### テストケース
1. ユーザー認証
2. フレーズ生成機能
3. フレーズ登録機能
4. エラーハンドリング
5. レスポンシブデザイン

#### パフォーマンステスト
- ページ読み込み速度
- API応答時間
- データベースパフォーマンス

## 継続的改善

### メトリクス監視
- ユーザー利用状況
- API エラー率
- パフォーマンス指標
- ユーザーフィードバック

### 定期的なタスク
- 依存関係の更新
- セキュリティパッチの適用
- パフォーマンス最適化
- ユーザビリティ改善

### 今後の機能拡張
- 音声入力対応
- オフライン機能
- 多言語対応拡張
- AI機能の強化
