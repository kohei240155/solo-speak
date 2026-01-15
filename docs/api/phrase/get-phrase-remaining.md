# GET /api/phrase/remaining

ユーザーの残りフレーズ生成回数を取得します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/phrase/remaining` |
| メソッド | `GET` |
| 認証 | 必要 |
| ファイル | `src/app/api/phrase/remaining/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

### パラメータ

なし

## レスポンス

### 成功時 (200 OK)

```typescript
interface RemainingGenerationsResponse {
  remainingGenerations: number;  // 残り生成回数（0-5）
}
```

**例:**

```json
{
  "remainingGenerations": 3
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 401 | 認証エラー |
| 404 | ユーザーが見つからない |
| 500 | 内部サーバーエラー |

## 実装詳細

### 日次リセットロジック

生成回数は**UTC基準**で毎日リセットされます。

```typescript
// UTC基準で今日の日付を取得
const now = new Date();
const todayUTC = new Date(
  Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
);

// 最後の生成日が今日より前の場合、回数を5にリセット
if (lastGenerationDayUTC.getTime() < todayUTC.getTime()) {
  remainingGenerations = 5;
  // DBを更新
}
```

### 初回アクセス時

`lastPhraseGenerationDate` が `null` の場合（初回）：
- 残り回数を5に設定
- `lastPhraseGenerationDate` を現在日時に設定

### 自動更新

このAPIはGETリクエストですが、日次リセットが必要な場合はDBを更新します：
- `remainingPhraseGenerations`: 5
- `lastPhraseGenerationDate`: 現在日時

## 使用例

```typescript
// フロントエンドでの使用例
const response = await fetch('/api/phrase/remaining', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const { remainingGenerations } = await response.json();

if (remainingGenerations === 0) {
  alert('本日の生成回数上限に達しました。明日また利用できます。');
} else {
  console.log(`残り${remainingGenerations}回生成できます`);
}
```

## 関連ファイル

- 型定義: `src/types/phrase.ts`
- 生成API: `src/app/api/phrase/generate/route.ts`
