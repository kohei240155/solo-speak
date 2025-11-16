# Dashboard API

## 概要
ダッシュボードに表示する統計データを取得するAPIエンドポイント。

## エンドポイント
`GET /api/dashboard`

## 認証
必要

## リクエストパラメータ

### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 |
|----------|-----|------|------|
| language | string | ✓ | 言語コード（例: "en", "ja", "es"） |

## レスポンス

### 成功時 (200 OK)
```typescript
interface DashboardData {
  totalPhraseCount: number;      // 指定言語のフレーズ総数
  speakCountToday: number;        // 今日のスピーク回数
  speakCountTotal: number;        // 総スピーク回数
  quizMastery: QuizMasteryLevel[]; // レベル別フレーズ数
}

interface QuizMasteryLevel {
  level: string;  // レベル名
  score: number;  // そのレベルのフレーズ数
  color: string;  // 表示用カラーコード
}
```

### エラー時
```json
{
  "error": "エラーメッセージ"
}
```

**エラーコード:**
- `400` - language パラメータが不足
- `401` - 認証失敗
- `500` - サーバーエラー

## 機能詳細
- 認証されたユーザーのデータのみを取得
- 今日の日付範囲は UTC 基準で計算
- 複数のデータベースクエリを `Promise.all` で並列実行してパフォーマンスを向上
- 削除されていないフレーズのみを対象

## 取得データ内訳
1. **総フレーズ数**: 指定言語で登録されているフレーズの総数
2. **今日のスピーク回数**: 本日（UTC基準）の音読練習回数
3. **総スピーク回数**: 累計の音読練習回数
4. **Quiz Mastery**: フレーズレベル別の統計データ

## 使用例
```typescript
const response = await fetch('/api/dashboard?language=en', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
const data = await response.json();
```

## 関連型定義
- `DashboardData` (`@/types/dashboard`)
- `QuizMasteryLevel` (`@/types/dashboard`)
- `ApiErrorResponse` (`@/types/api`)
