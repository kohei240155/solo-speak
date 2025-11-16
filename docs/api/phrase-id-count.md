# Phrase Count API

## 概要
フレーズの音読回数を更新し、speak_logsテーブルに記録を追加するAPIエンドポイント。

## エンドポイント
`POST /api/phrase/[id]/count`

## 認証
必要

## リクエスト

### パスパラメータ
| パラメータ | 型 | 説明 |
|----------|-----|------|
| id | string | フレーズID |

### リクエストボディ
```typescript
interface CountUpdateRequest {
  count?: number; // 増加するカウント数（0以上、デフォルト: 0）
}
```

## レスポンス

### 成功時 (200 OK)
```typescript
interface PhraseCountResponse {
  success: true;
  phrase: {
    id: string;
    original: string;         // 原文
    translation: string;      // 翻訳
    totalSpeakCount: number;  // 総音読回数
    dailySpeakCount: number;  // 今日の音読回数
  };
}
```

### エラー時
```json
{
  "error": "エラーメッセージ"
}
```

**エラーコード:**
- `400` - フレーズIDが不足
- `404` - フレーズが見つからない、またはアクセス権限なし
- `500` - サーバーエラー

## 機能詳細

### カウント更新ロジック
1. リクエストボディから `count` を取得（0以上の値、デフォルト0）
2. `count > 0` の場合のみ以下を実行：
   - `totalSpeakCount` を増加
   - `dailySpeakCount` を増加
   - `speak_logs` テーブルに記録を追加
3. すべてのケースで以下を更新：
   - `lastSpeakDate`: 現在時刻
   - `sessionSpoken`: true（セッション中に練習済みとマーク）

### トランザクション処理
音読回数の更新とログ記録を単一トランザクションで実行し、データの整合性を保証。

### セッション管理
- `sessionSpoken` フラグで同じセッション内での重複を防ぐ
- セッションリセットは `/api/phrases/reset-session` で実行

### ログ記録
`speak_logs` テーブルに以下を記録（`count > 0` の場合のみ）：
- `phraseId`: フレーズID
- `date`: 実行日時
- `count`: 音読回数

## 使用パターン

### パターン1: カウント増加あり
```json
{
  "count": 3
}
```
→ 音読回数を3増やし、ログに記録

### パターン2: カウント増加なし（フラグ更新のみ）
```json
{
  "count": 0
}
```
または
```json
{}
```
→ 音読回数は増やさず、`sessionSpoken` と `lastSpeakDate` のみ更新

## 使用例

### 音読回数を増やす
```typescript
const response = await fetch(`/api/phrase/${phraseId}/count`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    count: 1
  })
});
const data = await response.json();
console.log(`総音読回数: ${data.phrase.totalSpeakCount}`);
```

### セッションフラグのみ更新
```typescript
const response = await fetch(`/api/phrase/${phraseId}/count`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    count: 0
  })
});
```

## セキュリティ
- ユーザーは自分のフレーズのみ更新可能
- フレーズIDとユーザーIDの両方で検証

## 関連型定義
- `PhraseCountResponse` (`@/types/phrase`)
- `ApiErrorResponse` (`@/types/api`)

## 関連エンドポイント
- `GET /api/phrase/speak` - 音読練習用フレーズ取得
- `GET /api/phrase/[id]/speak` - 特定フレーズの音読データ取得
- `POST /api/phrases/reset-session` - セッションリセット
- `POST /api/user/reset-daily-speak-count` - 日次カウントリセット
