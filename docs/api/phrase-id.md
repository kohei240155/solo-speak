# Phrase by ID API

## 概要
特定のフレーズを更新または削除するAPIエンドポイント。

## エンドポイント
- `PUT /api/phrase/[id]` - フレーズ更新
- `DELETE /api/phrase/[id]` - フレーズ削除

## 認証
必要

---

## PUT /api/phrase/[id]

### リクエスト

#### パスパラメータ
| パラメータ | 型 | 説明 |
|----------|-----|------|
| id | string | フレーズID |

#### リクエストボディ
```typescript
interface UpdatePhraseRequestBody {
  original: string;      // 原文（1-200文字、必須）
  translation: string;   // 翻訳（1-200文字、必須）
}
```

### レスポンス

#### 成功時 (200 OK)
```typescript
interface UpdatePhraseResponseData {
  id: string;
  original: string;
  translation: string;
  createdAt: string;       // ISO 8601形式
  practiceCount: number;   // 音読練習回数
  correctAnswers: number;  // クイズ正解数
  language: {
    name: string;
    code: string;
  };
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
- `404` - フレーズが見つからない、またはアクセス権限なし
- `500` - サーバーエラー

### バリデーション
- `original`: 必須、1-200文字
- `translation`: 必須、1-200文字
- テキストは自動的にトリミングされる

---

## DELETE /api/phrase/[id]

### リクエスト

#### パスパラメータ
| パラメータ | 型 | 説明 |
|----------|-----|------|
| id | string | フレーズID |

### レスポンス

#### 成功時 (200 OK)
```typescript
interface DeletePhraseResponseData {
  message: "Phrase deleted successfully";
}
```

#### エラー時
```json
{
  "error": "エラーメッセージ"
}
```

**エラーコード:**
- `404` - フレーズが見つからない、またはアクセス権限なし
- `500` - サーバーエラー

### 機能詳細
- ソフトデリート方式（物理削除ではない）
- `deletedAt` フィールドに現在時刻を設定
- データは保持されるが、通常のクエリでは取得されない

## セキュリティ
- ユーザーは自分のフレーズのみ更新・削除可能
- フレーズIDとユーザーIDの両方で検証

## 使用例

### フレーズ更新
```typescript
const response = await fetch(`/api/phrase/${phraseId}`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    original: 'Good morning!',
    translation: 'おはようございます！'
  })
});
const updatedPhrase = await response.json();
```

### フレーズ削除
```typescript
const response = await fetch(`/api/phrase/${phraseId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
const result = await response.json();
```

## 関連型定義
- `UpdatePhraseRequestBody` (`@/types/phrase`)
- `UpdatePhraseResponseData` (`@/types/phrase`)
- `DeletePhraseResponseData` (`@/types/phrase`)
- `ApiErrorResponse` (`@/types/api`)

## 関連エンドポイント
- `POST /api/phrase` - フレーズ作成
- `GET /api/phrase` - フレーズ一覧取得
- `GET /api/phrase/[id]/speak` - 特定フレーズの音読データ取得
