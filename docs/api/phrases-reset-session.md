# Phrases Reset Session API

## 概要
セッション中の音読状態（`sessionSpoken` フラグ）をリセットするAPIエンドポイント。

## エンドポイント
`POST /api/phrases/reset-session`

## 認証
必要

## リクエスト
リクエストボディは不要。

## レスポンス

### 成功時 (200 OK)
```typescript
interface ResetSessionResponse {
  success: true;
  message: string;  // "Reset session_spoken for {count} phrases"
  count: number;    // リセットされたフレーズの数
}
```

### エラー時 (500 Internal Server Error)
```json
{
  "success": false,
  "error": "Failed to reset session_spoken"
}
```

## 機能詳細

### リセット対象
認証されたユーザーの以下のフレーズすべて：
- 削除されていないフレーズ（`deletedAt: null`）
- `sessionSpoken` フラグがあるすべてのフレーズ

### 実行内容
すべての対象フレーズの `sessionSpoken` を `false` に更新。

### 使用タイミング
- 新しい音読練習セッションを開始する前
- すべてのフレーズを再度練習可能にしたい時
- セッション終了時（任意）

## セッション管理の仕組み

### `sessionSpoken` フラグの役割
同じセッション内で同じフレーズが重複して出題されないようにするためのフラグ。

### フラグの状態遷移
1. **初期状態**: `sessionSpoken: false`
2. **音読後**: `/api/phrase/[id]/count` を呼ぶと `sessionSpoken: true` に変更
3. **リセット後**: このエンドポイントで再び `sessionSpoken: false` に戻る

### フィルタリングへの影響
`/api/phrase/speak` エンドポイントは `sessionSpoken: false` のフレーズのみを返すため、一度練習したフレーズは同じセッション内では出題されません。

## 使用例

### 基本的な使用
```typescript
const response = await fetch('/api/phrases/reset-session', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
const data = await response.json();

if (data.success) {
  console.log(`${data.count}個のフレーズをリセットしました`);
}
```

### セッション開始前のリセット
```typescript
// 新しい練習セッションを開始
async function startNewSession() {
  // まずセッションをリセット
  await fetch('/api/phrases/reset-session', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  });
  
  // 最初のフレーズを取得
  const response = await fetch('/api/phrase/speak?language=en', {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  });
  
  const data = await response.json();
  // フレーズで練習開始
}
```

### エラーハンドリング
```typescript
try {
  const response = await fetch('/api/phrases/reset-session', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  });
  
  const data = await response.json();
  
  if (!data.success) {
    console.error('リセットに失敗しました:', data.error);
  }
} catch (error) {
  console.error('エラー:', error);
}
```

## ワークフロー例

### 典型的な音読練習フロー
```typescript
// 1. セッションリセット
await fetch('/api/phrases/reset-session', { method: 'POST' });

// 2. フレーズ取得
const phraseResponse = await fetch('/api/phrase/speak?language=en');
const { phrase } = await phraseResponse.json();

// 3. ユーザーが音読

// 4. カウント更新（sessionSpoken が true になる）
await fetch(`/api/phrase/${phrase.id}/count`, {
  method: 'POST',
  body: JSON.stringify({ count: 1 })
});

// 5. 次のフレーズ取得（先ほどのフレーズは除外される）
const nextPhraseResponse = await fetch('/api/phrase/speak?language=en');

// ... 繰り返し
```

## パフォーマンス
- 一括更新（`updateMany`）でパフォーマンスを最適化
- ユーザーのフレーズ数に応じて処理時間が変動

## 関連型定義
- `ResetSessionResponse` (内部型)

## 関連エンドポイント
- `GET /api/phrase/speak` - 音読練習用フレーズ取得
- `POST /api/phrase/[id]/count` - 音読回数更新（sessionSpokenをtrueにする）
