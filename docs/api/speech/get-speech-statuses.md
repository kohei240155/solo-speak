# GET /api/speech/statuses

スピーチステータス一覧を取得します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/speech/statuses` |
| メソッド | `GET` |
| 認証 | 不要 |
| ファイル | `src/app/api/speech/statuses/route.ts` |

## リクエスト

### パラメータ

なし

## レスポンス

### 成功時 (200 OK)

```typescript
interface SpeechStatusListResponse {
  statuses: Array<{
    id: string;
    name: string;
  }>;
}
```

**例:**

```json
{
  "statuses": [
    { "id": "status_a", "name": "A" },
    { "id": "status_b", "name": "B" },
    { "id": "status_c", "name": "C" },
    { "id": "status_d", "name": "D" }
  ]
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 500 | 内部サーバーエラー |

## 実装詳細

### ステータス一覧

| ステータス | 説明 |
|-----------|------|
| A | マスター（完璧に話せる） |
| B | 良好（ほぼ話せる） |
| C | 練習中（まだ不安） |
| D | 未復習（まだ復習していない） |

### ソート順

ステータス名の昇順（A → B → C → D）

### フィルタリング

`deletedAt: null` のステータスのみ返却

## 使用例

```typescript
// フロントエンドでの使用例
const response = await fetch('/api/speech/statuses');
const { statuses } = await response.json();

// ステータス選択ドロップダウンに使用
statuses.forEach(status => {
  console.log(`${status.name}: ${status.id}`);
});
```

## 関連ファイル

- ステータス更新: `src/app/api/speech/[id]/status/route.ts`
