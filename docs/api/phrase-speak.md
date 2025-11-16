# Phrase Speak API

## 概要
音読練習用のフレーズを取得するAPIエンドポイント。条件に基づいてフィルタリングとソートを行い、最適な練習フレーズを返します。

## エンドポイント
`GET /api/phrase/speak`

## 認証
必要

## リクエスト

### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 |
|----------|-----|------|------|
| language | string | ✓ | 言語コード（例: "en", "ja"） |
| excludeIfSpeakCountGTE | number | - | この回数以上音読したフレーズを除外 |
| excludeTodayPracticed | boolean | - | 今日練習済みのフレーズを除外（true/false） |

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

### フレーズがない場合 (200 OK)
```json
{
  "success": false,
  "message": "No phrases available for practice in this session"
}
```

### エラー時

#### 言語パラメータ不足 (400 Bad Request)
```json
{
  "error": "Language parameter is required"
}
```

#### 言語が見つからない (400 Bad Request)
```json
{
  "success": false,
  "message": "Language with code 'xx' not found"
}
```

#### サーバーエラー (500 Internal Server Error)
```json
{
  "error": "Internal server error"
}
```

## 機能詳細

### フィルタリング条件
以下のすべての条件を満たすフレーズのみを取得：
- 認証されたユーザーのフレーズ
- 指定された言語のフレーズ
- 削除されていないフレーズ（`deletedAt: null`）
- セッション中にまだSpeak練習していないフレーズ（`sessionSpoken: false`）
- オプション: 今日練習していないフレーズ（`excludeTodayPracticed=true` の場合）
- オプション: 指定回数未満の音読回数（`excludeIfSpeakCountGTE` が指定されている場合）

### ソート優先順位
1. **音読回数**: 少ない順を優先
2. **登録日時**: 古い順を優先（音読回数が同じ場合）

この優先順位により、まだ練習していない古いフレーズから優先的に出題されます。

### セッション管理
- `sessionSpoken` フラグで同じセッション内での重複を防ぐ
- セッションリセットは `/api/phrases/reset-session` で実行

## 使用例

### 基本的な使用
```typescript
const response = await fetch('/api/phrase/speak?language=en', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
const data = await response.json();

if (data.success) {
  console.log('練習フレーズ:', data.phrase.original);
}
```

### フィルタリングオプション付き
```typescript
// 10回以上練習済みのフレーズを除外し、今日練習していないものを取得
const response = await fetch(
  '/api/phrase/speak?language=en&excludeIfSpeakCountGTE=10&excludeTodayPracticed=true',
  {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  }
);
```

## モード設定
クエリパラメータで柔軟なモード設定が可能：

### すべてのフレーズ
```
?language=en
```

### 初心者モード（10回未満のフレーズのみ）
```
?language=en&excludeIfSpeakCountGTE=10
```

### 今日未練習のフレーズのみ
```
?language=en&excludeTodayPracticed=true
```

### 組み合わせ
```
?language=en&excludeIfSpeakCountGTE=5&excludeTodayPracticed=true
```

## 関連型定義
- `SpeakPhraseResponse` (`@/types/phrase`)
- `ApiErrorResponse` (`@/types/api`)

## 関連エンドポイント
- `POST /api/phrase/[id]/count` - 音読回数更新
- `POST /api/phrases/reset-session` - セッションリセット
- `GET /api/phrase/[id]/speak` - 特定のフレーズ取得
