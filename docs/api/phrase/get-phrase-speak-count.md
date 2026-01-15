# GET /api/phrase/speak/count

音読練習対象のフレーズ数を取得します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/phrase/speak/count` |
| メソッド | `GET` |
| 認証 | 必要 |
| ファイル | `src/app/api/phrase/speak/count/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| language | string | Yes | - | 言語コード（例: "en"） |
| excludeIfSpeakCountGTE | number | - | - | 指定回数以上の音読済みフレーズを除外 |
| excludeTodayPracticed | boolean | - | false | 今日練習済みのフレーズを除外 |

**例:**

```
GET /api/phrase/speak/count?language=en&excludeIfSpeakCountGTE=10
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface SpeakPhraseCountResponse {
  success: true;
  count: number;  // 対象フレーズ数
}
```

**例:**

```json
{
  "success": true,
  "count": 15
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | 言語パラメータが必要、または言語が見つからない |
| 401 | 認証エラー |
| 500 | 内部サーバーエラー |

**例（言語が見つからない）:**

```json
{
  "success": false,
  "count": 0,
  "message": "Language with code 'xx' not found"
}
```

## 実装詳細

### フィルタリング条件

`GET /api/phrase/speak` と同じ条件を使用：

| 条件 | 説明 |
|------|------|
| userId | 認証されたユーザーのフレーズのみ |
| language.code | 指定された言語のフレーズのみ |
| deletedAt: null | 削除されていないフレーズのみ |
| sessionSpoken: false | セッション中に未練習のフレーズのみ |
| dailySpeakCount: 0 | `excludeTodayPracticed=true` の場合 |
| totalSpeakCount < N | `excludeIfSpeakCountGTE=N` の場合 |

### パフォーマンス最適化

言語の存在確認とカウントを `Promise.all` で並列実行

## 使用例

```typescript
// フロントエンドでの使用例
// 練習開始前に残りフレーズ数を確認
const response = await fetch(
  '/api/phrase/speak/count?language=en&excludeTodayPracticed=true',
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const { count } = await response.json();

if (count === 0) {
  alert('練習対象のフレーズがありません');
} else {
  console.log(`${count}件のフレーズを練習できます`);
}
```

## 関連ファイル

- 型定義: `src/types/phrase.ts`
- フレーズ取得: `src/app/api/phrase/speak/route.ts`
