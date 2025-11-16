# Situations API

## 概要
シチュエーション（学習シーン）の一覧取得と新規作成を行うAPIエンドポイント。

## エンドポイント
- `GET /api/situations` - シチュエーション一覧取得
- `POST /api/situations` - シチュエーション新規作成

## 認証
必要

---

## GET /api/situations

### リクエスト
認証ヘッダーが必要。

### レスポンス

#### 成功時 (200 OK)
```typescript
interface SituationsListResponse {
  situations: Situation[];
}

interface Situation {
  id: string;
  name: string;
  createdAt: string; // ISO 8601形式
  updatedAt: string; // ISO 8601形式
}
```

#### エラー時 (500 Internal Server Error)
```json
{
  "error": "Internal server error"
}
```

### 機能詳細
- 認証されたユーザーのシチュエーションのみを取得
- 削除されていないシチュエーションのみ（`deletedAt: null`）
- 作成日時の降順でソート（新しいものが先頭）

---

## POST /api/situations

### リクエスト

#### リクエストボディ
```typescript
interface CreateSituationRequest {
  name: string; // 最大20文字
}
```

### レスポンス

#### 成功時 (201 Created)
```typescript
interface Situation {
  id: string;
  name: string;
  createdAt: string; // ISO 8601形式
  updatedAt: string; // ISO 8601形式
}
```

#### エラー時
```json
{
  "error": "エラーメッセージ"
}
```

**エラーコード:**
- `400` - バリデーションエラー
  - シチュエーション名が空
  - シチュエーション名が20文字を超える
- `401` - 認証失敗
- `409` - 同名のシチュエーションが既に存在
- `500` - サーバーエラー

### バリデーション
- シチュエーション名は必須
- シチュエーション名は空白のみ不可
- シチュエーション名は最大20文字
- 同じユーザーで同名のシチュエーションは作成不可

### 機能詳細
- 名前は自動的にトリミングされる
- 同名チェックは削除されていないシチュエーションのみが対象

## 使用例

### 一覧取得
```typescript
const response = await fetch('/api/situations', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
const { situations } = await response.json();
```

### 新規作成
```typescript
const response = await fetch('/api/situations', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'レストラン'
  })
});
const situation = await response.json();
```

## 関連型定義
- `SituationsListResponse` (`@/types/situation`)
- `CreateSituationRequest` (`@/types/situation`)
- `ApiErrorResponse` (`@/types/api`)
