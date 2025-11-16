# Phrase Speak by ID API

## 概要
特定のフレーズの音読練習用データを取得するAPIエンドポイント。

## エンドポイント
`GET /api/phrase/[id]/speak`

## 認証
必要

## リクエスト

### パスパラメータ
| パラメータ | 型 | 説明 |
|----------|-----|------|
| id | string | フレーズID |

## レスポンス

### 成功時 (200 OK)
```typescript
interface SpeakPhraseResponse {
  success: true;
  phrase: {
    id: string;
    original: string;           // 原文
    translation: string;        // 翻訳
    explanation?: string;       // 説明（任意）
    totalSpeakCount: number;    // 総音読回数
    dailySpeakCount: number;    // 今日の音読回数
    languageCode: string;       // 言語コード
  };
}
```

### エラー時

#### フレーズが見つからない (404 Not Found)
```json
{
  "error": "Phrase not found or access denied"
}
```

#### サーバーエラー (500 Internal Server Error)
```json
{
  "error": "Internal server error"
}
```

## 機能詳細

### データ取得条件
以下のすべての条件を満たすフレーズのみ取得可能：
- 認証されたユーザーのフレーズ
- 削除されていないフレーズ（`deletedAt: null`）
- 指定されたIDに一致

### セキュリティ
- ユーザーは自分のフレーズのみアクセス可能
- 他のユーザーのフレーズにアクセスしようとすると404エラー

### 含まれる情報
- 基本情報: ID、原文、翻訳、説明
- 統計情報: 総音読回数、今日の音読回数
- 言語情報: 言語コード

## `/api/phrase/speak` との違い

| 機能 | `/api/phrase/speak` | `/api/phrase/[id]/speak` |
|------|-------------------|------------------------|
| 用途 | 次に練習すべきフレーズを自動選択 | 特定のフレーズを直接取得 |
| フィルタリング | あり（複数条件） | なし（IDのみ） |
| ソート | あり（優先順位付き） | なし |
| セッション管理 | あり（sessionSpoken） | なし |
| 言語指定 | 必須 | 不要（フレーズに含まれる） |

## 使用例

### 基本的な使用
```typescript
const response = await fetch(`/api/phrase/${phraseId}/speak`, {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
const data = await response.json();

if (data.success) {
  console.log('原文:', data.phrase.original);
  console.log('翻訳:', data.phrase.translation);
  console.log('総音読回数:', data.phrase.totalSpeakCount);
}
```

### エラーハンドリング
```typescript
try {
  const response = await fetch(`/api/phrase/${phraseId}/speak`, {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      console.error('フレーズが見つかりません');
    }
    return;
  }
  
  const data = await response.json();
  // データ処理
} catch (error) {
  console.error('エラー:', error);
}
```

## ユースケース
- 特定のフレーズを復習したい場合
- フレーズ詳細ページからの音読練習
- お気に入りフレーズの練習
- フレーズ一覧から選択した項目の練習

## 関連型定義
- `SpeakPhraseResponse` (`@/types/phrase`)
- `ApiErrorResponse` (`@/types/api`)

## 関連エンドポイント
- `GET /api/phrase/speak` - 音読練習用フレーズ自動選択
- `POST /api/phrase/[id]/count` - 音読回数更新
- `GET /api/phrase/[id]` - フレーズ詳細取得（このエンドポイントが存在しない可能性あり）
