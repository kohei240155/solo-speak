# GET /api/dashboard

ダッシュボードの統計データを取得します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/dashboard` |
| メソッド | `GET` |
| 認証 | 必要 |
| ファイル | `src/app/api/dashboard/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| language | string | Yes | 言語コード（例: "en"） |

**例:**

```
GET /api/dashboard?language=en
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface DashboardData {
  totalPhraseCount: number;            // フレーズ総数
  speakCountTotal: number;             // 音読回数合計
  quizMastery: QuizMasteryLevel[];     // レベル別フレーズ数
  phraseStreak: StreakData;            // フレーズ登録Streak
  speakStreak: StreakData;             // 音読Streak
  quizStreak: StreakData;              // クイズStreak
  speechReviewStreak: StreakData;      // スピーチ復習Streak
  speechLevelStatistics: SpeechLevelStatistic[];  // ステータス別スピーチ数
}

interface QuizMasteryLevel {
  level: string;   // Lv1, Lv2, Lv3, Lv4, Lv5
  score: number;   // そのレベルのフレーズ数
  color: string;   // グラフ表示用の色
}

interface StreakData {
  current: number;   // 現在の連続日数
  max: number;       // 最大連続日数
  dates: string[];   // 活動日のリスト
}

interface SpeechLevelStatistic {
  status: string;  // A, B, C, D
  count: number;   // そのステータスのスピーチ数
  color: string;   // グラフ表示用の色
}
```

**例:**

```json
{
  "totalPhraseCount": 150,
  "speakCountTotal": 500,
  "quizMastery": [
    { "level": "Lv1", "score": 50, "color": "#10b981" },
    { "level": "Lv2", "score": 40, "color": "#3b82f6" },
    { "level": "Lv3", "score": 30, "color": "#8b5cf6" },
    { "level": "Lv4", "score": 20, "color": "#f59e0b" },
    { "level": "Lv5", "score": 10, "color": "#ef4444" }
  ],
  "phraseStreak": {
    "current": 5,
    "max": 15,
    "dates": ["2024-01-10", "2024-01-11", "2024-01-12", "2024-01-13", "2024-01-14"]
  },
  "speakStreak": {
    "current": 3,
    "max": 10,
    "dates": ["2024-01-12", "2024-01-13", "2024-01-14"]
  },
  "quizStreak": {
    "current": 7,
    "max": 7,
    "dates": [...]
  },
  "speechReviewStreak": {
    "current": 2,
    "max": 5,
    "dates": [...]
  },
  "speechLevelStatistics": [
    { "status": "A", "count": 5, "color": "#1f2937" },
    { "status": "B", "count": 8, "color": "#4b5563" },
    { "status": "C", "count": 3, "color": "#6b7280" },
    { "status": "D", "count": 4, "color": "#9ca3af" }
  ]
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | 言語パラメータが必要、または言語が見つからない |
| 401 | 認証エラー |
| 500 | 内部サーバーエラー |

## 実装詳細

### パフォーマンス最適化

10個のデータベースクエリを `Promise.all` で並列実行：

1. フレーズ総数
2. 音読回数合計（SpeakLog集計）
3. 全フレーズ（レベル別集計用）
4. 全フレーズレベル
5. フレーズStreak用データ
6. 音読Streak用データ（SpeakLog）
7. クイズStreak用データ（QuizResult）
8. スピーチ復習Streak用データ
9. 全スピーチ（ステータス別集計用）
10. 全スピーチステータス

### Streak計算

`calculateStreak()` 関数で連続日数を計算：
- 現在の連続日数（今日または昨日から遡って連続している日数）
- 最大連続日数
- 活動日のリスト

### ステータス色

| ステータス | 色 |
|-----------|-----|
| A | #1f2937 (gray-800) |
| B | #4b5563 (gray-600) |
| C | #6b7280 (gray-500) |
| D | #9ca3af (gray-400) |

## 関連ファイル

- 型定義: `src/types/dashboard.ts`
- Streak計算: `src/utils/streak-calculator.ts`
