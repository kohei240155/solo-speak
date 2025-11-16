# Languages API

## 概要
言語一覧を取得するAPIエンドポイント。

## エンドポイント
`GET /api/languages`

## 認証
不要（パブリックAPI）

## リクエスト
認証なしでアクセス可能。

## レスポンス

### 成功時 (200 OK)
```typescript
Language[]

interface Language {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

### エラー時 (500 Internal Server Error)
```json
{
  "error": "エラーメッセージ"
}
```

## 機能詳細
- 削除されていない言語のみを取得（`deletedAt: null`）
- 言語名の昇順でソート
- データベースに言語が存在しない場合はエラーを返す

## 使用例
```typescript
const response = await fetch('/api/languages');
const languages = await response.json();
```

## 関連型定義
- `LanguagesResponseData` (`@/types/language`)
