# テスト方針

## 概要

Solo Speakのテスト戦略とガイドラインを説明します。

## テストフレームワーク

### 採用技術

| 種類 | ツール | 用途 |
|------|--------|------|
| テストランナー | Jest | テスト実行、カバレッジ |
| コンポーネントテスト | React Testing Library | Reactコンポーネントテスト |
| DOMテスト | @testing-library/dom | DOM操作テスト |
| マッチャー | @testing-library/jest-dom | 拡張アサーション |

### テストコマンド

| コマンド | 説明 |
|----------|------|
| `npm run test` | 全テスト実行 |
| `npm run test:watch` | ウォッチモードでテスト実行 |
| `npm run test:coverage` | カバレッジレポート付きテスト実行 |
| `npm run test:ci` | CI環境用テスト実行 |

コマンド一覧: [docs/setup.md](setup.md#テストコマンド)

## テストファイル規約

### 命名規則

| 対象 | ファイル名パターン | 例 |
|------|-------------------|-----|
| コンポーネント | `ComponentName.test.tsx` | `LoadingSpinner.test.tsx` |
| カスタムフック | `useHookName.test.ts` | `useApi.test.ts` |
| APIルート | `route.test.ts` | `src/app/api/phrase/route.test.ts` |
| ユーティリティ | `utilName.test.ts` | `api-helpers.test.ts` |

### 配置ルール

テストファイルは対象ファイルと同じディレクトリに配置:

```
src/
├── components/
│   └── common/
│       ├── LoadingSpinner.tsx
│       └── LoadingSpinner.test.tsx  ← 同階層
├── hooks/
│   └── api/
│       ├── useApi.ts
│       └── useApi.test.ts           ← 同階層
└── app/
    └── api/
        └── phrase/
            ├── route.ts
            └── route.test.ts        ← 同階層
```

## テスト実装ガイド

### コンポーネントテスト

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoadingSpinner from './LoadingSpinner'

describe('LoadingSpinner', () => {
  it('デフォルトサイズでレンダリングされる', () => {
    render(<LoadingSpinner />)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('メッセージが表示される', () => {
    render(<LoadingSpinner message="読み込み中..." />)
    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })
})
```

### カスタムフックテスト

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useApi } from './useApi'

// モックの設定
jest.mock('@/utils/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))

describe('useApi', () => {
  it('データを取得できる', async () => {
    const mockData = { id: '1', name: 'test' }
    require('@/utils/api').api.get.mockResolvedValue(mockData)

    const { result } = renderHook(() => useApi('/api/test'))

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData)
    })
  })
})
```

### APIルートテスト

```typescript
import { NextRequest } from 'next/server'
import { POST, GET } from './route'

// モックの設定
jest.mock('@/utils/prisma', () => ({
  prisma: {
    phrase: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

jest.mock('@/utils/api-helpers', () => ({
  authenticateRequest: jest.fn(),
}))

describe('POST /api/phrase', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('認証なしで401を返す', async () => {
    const { authenticateRequest } = require('@/utils/api-helpers')
    authenticateRequest.mockResolvedValue({
      error: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    })

    const request = new NextRequest('http://localhost/api/phrase', {
      method: 'POST',
      body: JSON.stringify({ original: 'test' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })
})
```

## TDD ワークフロー

### Red-Green-Refactor サイクル

1. **🔴 Red**: 失敗するテストを書く
   - 期待する動作を明確にする
   - テストが失敗することを確認

2. **🟢 Green**: テストを通す最小限のコードを書く
   - 完璧でなくてOK
   - まずはテストをパスさせることを優先

3. **🔵 Refactor**: コードを改善する
   - 重複の除去
   - 命名の改善
   - テストがパスし続けることを確認

### 実践例

```bash
# 1. テストファイルを作成（Red）
# 2. テスト実行 → 失敗を確認
npm run test:watch

# 3. 実装（Green）
# 4. テスト実行 → パスを確認

# 5. リファクタリング（Refactor）
# 6. テスト実行 → パスを維持
```

## テスト優先度

### 高優先度（必須）

- APIルートのバリデーション
- 認証・認可ロジック
- データ変換ロジック
- エラーハンドリング

### 中優先度（推奨）

- カスタムフック
- ユーティリティ関数
- フォームバリデーション

### 低優先度（オプション）

- 純粋な表示コンポーネント
- スタイリングのみのコンポーネント

## カバレッジ目標

| 対象 | 目標 |
|------|------|
| APIルート | 80%以上 |
| カスタムフック | 70%以上 |
| ユーティリティ | 90%以上 |
| UIコンポーネント | 50%以上 |

## モック戦略

### グローバルモック（jest.setup.ts）

- Next.js Router
- 環境変数

### ファイル単位モック

```typescript
jest.mock('@/utils/prisma')
jest.mock('@/utils/supabase-server')
jest.mock('@/utils/api-helpers')
```

### モックファイル（__mocks__/）

```
__mocks__/
├── prisma.ts      # Prismaクライアントモック
└── supabase.ts    # Supabaseクライアントモック
```

---

## 手動テスト

### 機能テストチェックリスト

#### 認証

- [ ] Google OAuth ログイン
- [ ] ログアウト
- [ ] セッション維持

#### フレーズ機能

- [ ] フレーズ生成（3スタイル）
- [ ] フレーズ一覧表示
- [ ] フレーズ編集
- [ ] フレーズ削除
- [ ] TTS再生

#### クイズ機能

- [ ] クイズ開始
- [ ] 4択回答
- [ ] 正解/不正解表示
- [ ] スコア更新

#### スピーキング機能

- [ ] 音声認識
- [ ] 発話記録
- [ ] セッションリセット

#### スピーチ機能

- [ ] スピーチ作成
- [ ] AI添削
- [ ] スピーキングプラン表示
- [ ] ステータス更新
- [ ] メモ保存

#### ランキング

- [ ] 各種ランキング表示
- [ ] 連続記録表示

#### 設定

- [ ] ユーザー設定変更
- [ ] アイコン変更
- [ ] 言語設定

#### 決済

- [ ] チェックアウト
- [ ] サブスクリプション状態表示
- [ ] 解約

### ブラウザテスト

| ブラウザ | 優先度 |
|----------|--------|
| Chrome (デスクトップ) | 高 |
| Safari (デスクトップ) | 高 |
| Chrome (モバイル) | 高 |
| Safari (iOS) | 高 |
| Firefox | 中 |
| Edge | 低 |

### 音声機能テスト

音声機能はブラウザ依存が大きいため、特に注意が必要です。

| 機能 | Chrome | Safari | Firefox |
|------|--------|--------|---------|
| TTS再生 | OK | 要確認 | OK |
| 音声認識 | OK | OK | 未対応 |

## コード品質

### ESLint

すべてのPRでlintエラー・警告が0件であることを確認してください。

**成功条件**: 出力に警告・エラーがないこと

### TypeScript

ビルドが成功することで型エラーがないことを確認できます。

**成功条件**: exit code 0、エラー出力なし

コマンド一覧: [docs/setup.md](setup.md#基本コマンド日常使用)

### Claude Code向けチェックフロー

コード変更後、以下の順序でチェックを実行：

1. テスト実行 → 全テストパスを確認
2. ESLint実行 → 警告・エラー0件を確認
3. TypeScriptビルド → 成功を確認
4. 失敗時は [docs/troubleshooting.md](troubleshooting.md) を参照

## APIテスト

### curlでのテスト例

```bash
# 認証なしでアクセス（401が返ることを確認）
curl http://localhost:3000/api/phrase

# 認証付きでアクセス（要: 有効なJWTトークン）
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/phrase
```

### Postman / Insomnia

APIテストにはPostmanやInsomniaを使用できます。

1. コレクションを作成
2. 環境変数に `baseUrl` と `token` を設定
3. エンドポイントをテスト

## パフォーマンステスト

### Lighthouse

Chrome DevTools > Lighthouse でパフォーマンスを測定できます。

目標スコア:
- Performance: 80+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

### Web Vitals

- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

## セキュリティテスト

### チェック項目

- [ ] 認証なしでAPIにアクセスできないこと
- [ ] 他ユーザーのデータにアクセスできないこと
- [ ] XSS対策（ユーザー入力のサニタイズ）
- [ ] CSRF対策
- [ ] SQLインジェクション対策（Prismaが対応）

## テスト報告

バグを発見した場合は、GitHub Issuesに以下の情報を含めて報告してください：

1. 再現手順
2. 期待される動作
3. 実際の動作
4. 環境（ブラウザ、OS）
5. スクリーンショット（可能であれば）
