# GET /api/speech/remaining

ユーザーの残りスピーチ添削回数を取得します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/speech/remaining` |
| メソッド | `GET` |
| 認証 | 必要 |
| ファイル | `src/app/api/speech/remaining/route.ts` |

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
interface RemainingSpeechCountResponse {
  remainingSpeechCount: number;  // 残り添削回数（0-1）
}
```

**例:**

```json
{
  "remainingSpeechCount": 1
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

添削回数は**UTC基準**で毎日リセットされます。

```typescript
const now = new Date();
const todayUTC = new Date(
  Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
);

// 最後のリセット日が今日より前の場合、回数を1にリセット
if (lastResetDayUTC.getTime() < todayUTC.getTime()) {
  remainingSpeechCount = 1;
  // DBを更新
}
```

### 初回アクセス時

`lastSpeechCountResetDate` が `null` の場合（初回）：
- 残り回数を1に設定
- `lastSpeechCountResetDate` を現在日時に設定

### フレーズ生成との違い

| 機能 | 1日の回数 |
|------|----------|
| フレーズ生成 | 5回 |
| スピーチ添削 | 1回 |

## 使用例

```typescript
// フロントエンドでの使用例
const response = await fetch('/api/speech/remaining', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const { remainingSpeechCount } = await response.json();

if (remainingSpeechCount === 0) {
  alert('本日の添削回数上限に達しました。明日また利用できます。');
}
```

## 関連ファイル

- 型定義: `src/types/speech.ts`
- 添削API: `src/app/api/speech/correct/route.ts`
