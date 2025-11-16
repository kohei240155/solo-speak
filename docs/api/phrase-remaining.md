# Phrase Remaining API

## 概要
ユーザーの残りフレーズ生成回数を取得するAPIエンドポイント。

## エンドポイント
`GET /api/phrase/remaining`

## 認証
必要

## リクエスト
認証ヘッダーのみ必要。

## レスポンス

### 成功時 (200 OK)
```typescript
interface RemainingGenerationsResponse {
  remainingGenerations: number; // 残りの生成回数
}
```

### エラー時

#### ユーザーが見つからない (404 Not Found)
```json
{
  "error": "User not found"
}
```

#### サーバーエラー (500 Internal Server Error)
```json
{
  "error": "エラーメッセージ"
}
```

## 機能詳細

### 日次リセットロジック
APIは呼び出し時に以下の自動リセットを実行します：

1. **初回アクセス時**
   - `lastPhraseGenerationDate` が null の場合
   - 残り回数を5回に設定
   - 現在時刻を `lastPhraseGenerationDate` に記録

2. **日付が変わった場合**
   - 最後の生成日が今日より前の場合（UTC基準）
   - 残り回数を5回にリセット
   - 現在時刻を `lastPhraseGenerationDate` に更新

### UTC基準の日付比較
- すべての日付計算はUTC基準で行われる
- タイムゾーンに依存しない一貫した動作を保証

### データベース更新
リセット条件に該当する場合、以下を更新：
- `remainingPhraseGenerations`: 5に設定
- `lastPhraseGenerationDate`: 現在時刻

## デフォルト値
- 初期生成回数: **5回/日**（無料プラン）
- リセット時刻: UTC 0時

## 使用例
```typescript
const response = await fetch('/api/phrase/remaining', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
const { remainingGenerations } = await response.json();
console.log(`残り生成回数: ${remainingGenerations}`);
```

## 注意事項
- このエンドポイントは取得のみで、回数を減らすことはありません
- 実際の回数減算は `/api/phrase/generate` で行われます
- リセット判定のためデータベース更新が発生する可能性があります

## 関連型定義
- `RemainingGenerationsResponse` (`@/types/phrase`)

## 関連エンドポイント
- `POST /api/phrase/generate` - フレーズ生成（回数を1減らす）
