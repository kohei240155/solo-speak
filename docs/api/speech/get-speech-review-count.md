# GET /api/speech/review/count

復習対象のスピーチ件数を取得します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/speech/review/count` |
| メソッド | `GET` |
| 認証 | 必要 |
| ファイル | `src/app/api/speech/review/count/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| languageCode | string | Yes | - | 言語コード（例: "en"） |
| speakCountFilter | string | - | - | "lessPractice" or "lowStatus" |
| excludeTodayPracticed | boolean | - | true | 今日練習済みを除外 |

**例:**

```
GET /api/speech/review/count?languageCode=en
GET /api/speech/review/count?languageCode=en&excludeTodayPracticed=false
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface SpeechReviewCountResponse {
  success: true;
  count: number;
}
```

**例:**

```json
{
  "success": true,
  "count": 5
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | 言語コードが必要、またはフィルター値が不正 |
| 401 | 認証エラー |
| 404 | 言語が見つからない |
| 500 | 内部サーバーエラー |

## 実装詳細

### フィルタリング条件

`GET /api/speech/review` と同じ条件を使用

## 使用例

```typescript
// フロントエンドでの使用例
const response = await fetch(
  '/api/speech/review/count?languageCode=en',
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const { count } = await response.json();

if (count === 0) {
  alert('復習対象のスピーチがありません');
} else {
  console.log(`${count}件のスピーチを復習できます`);
}
```

## 関連ファイル

- 型定義: `src/types/speech.ts`
- 復習取得: `src/app/api/speech/review/route.ts`
