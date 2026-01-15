# GET /api/languages

利用可能な言語一覧を取得します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/languages` |
| メソッド | `GET` |
| 認証 | 不要 |
| ファイル | `src/app/api/languages/route.ts` |

## リクエスト

### ヘッダー

認証不要のため、特別なヘッダーは必要ありません。

### パラメータ

なし

## レスポンス

### 成功時 (200 OK)

言語オブジェクトの配列を返します。

```typescript
type LanguagesResponseData = Language[];

interface Language {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

**例:**

```json
[
  {
    "id": "clxx1234567890",
    "name": "English",
    "code": "en",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "deletedAt": null
  },
  {
    "id": "clxx1234567891",
    "name": "Japanese",
    "code": "ja",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "deletedAt": null
  }
]
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 500 | データベースエラー、または言語が見つからない場合 |

**例:**

```json
{
  "error": "No languages found in database"
}
```

## 実装詳細

- `deletedAt: null` の言語のみを返却（ソフトデリート対応）
- `name` の昇順でソート
- 言語が0件の場合はエラーレスポンスを返却

## 対応言語

本システムは以下の9言語に対応しています：

| コード | 言語名 |
|--------|--------|
| en | English |
| ja | Japanese |
| zh | Chinese |
| ko | Korean |
| es | Spanish |
| fr | French |
| de | German |
| pt | Portuguese |
| it | Italian |

## 使用例

```typescript
// フロントエンドでの使用例
const response = await fetch('/api/languages');
const languages = await response.json();

// 言語選択ドロップダウンに使用
languages.forEach(lang => {
  console.log(`${lang.name} (${lang.code})`);
});
```

## 関連ファイル

- 型定義: `src/types/language.ts`
- 共通型: `src/types/common.ts`
