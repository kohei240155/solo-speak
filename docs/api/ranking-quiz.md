# Ranking Quiz API

## 概要
クイズ正解数に基づくランキングを取得するAPIエンドポイント。

## エンドポイント
`GET /api/ranking/quiz`

## 認証
必要

## リクエスト

### クエリパラメータ
| パラメータ | 型 | 必須 | デフォルト | 説明 |
|----------|-----|------|-----------|------|
| language | string | - | デフォルト言語 | 言語コード（例: "en", "ja"） |
| period | string | - | "daily" | "daily", "weekly", "total" |

## レスポンス

### 成功時 (200 OK)
```typescript
interface QuizRankingResponse {
  success: true;
  topUsers: RankingUser[];      // 上位10位まで
  currentUser: RankingUser | null; // ログインユーザーの順位（圏外含む）
}

interface RankingUser {
  rank: number;         // 順位
  userId: string;       // ユーザーID
  username: string;     // ユーザー名
  iconUrl: string | null; // アイコンURL
  count: number;        // 正解数
}
```

### エラー時

#### 言語が見つからない (400 Bad Request)
```json
{
  "success": false,
  "error": "Language not found"
}
```

#### サーバーエラー (500 Internal Server Error)
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "エラー詳細",
  "details": "スタックトレース"
}
```

## 機能詳細

### 期間設定

#### Daily（今日）
- 当日（UTC基準）のクイズ正解数でランキング
- 開始時刻: 今日の 00:00:00 UTC

#### Weekly（1週間）
- 過去7日間のクイズ正解数でランキング
- 開始時刻: 現在時刻 - 7日

#### Total（全期間）
- 全期間のクイズ正解数でランキング
- 開始時刻: 1970-01-01

### 集計ロジック
1. 指定期間内の `quizResults` テーブルから正解データ（`correct: true`）のみ取得
2. ユーザーごとに正解数を集計
3. 削除されていないフレーズと削除されていないクイズ結果のみを対象

### ランキング順位の決定
1. **正解数**: 多い順
2. **登録日時**: 同数の場合、アカウント作成日が古い方が上位

### 取得データ
- **topUsers**: 上位10位までのユーザー
- **currentUser**: ログインユーザーの順位
  - 10位以内: `topUsers` に含まれる
  - 11位以降: 全データから順位を計算して返す
  - データなし: null

### セキュリティ
- 他のユーザーの詳細情報は表示名とアイコンのみ
- ユーザーIDは公開されるが、センシティブな情報は含まない

## 使用例

### 今日のランキング
```typescript
const response = await fetch('/api/ranking/quiz?language=en&period=daily', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
const data = await response.json();

console.log('トップ10:', data.topUsers);
console.log('自分の順位:', data.currentUser?.rank);
```

### 全期間のランキング
```typescript
const response = await fetch('/api/ranking/quiz?language=en&period=total', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
const { topUsers, currentUser } = await response.json();

topUsers.forEach(user => {
  console.log(`${user.rank}位: ${user.username} (${user.count}問)`);
});

if (currentUser && currentUser.rank > 10) {
  console.log(`あなたの順位: ${currentUser.rank}位`);
}
```

### 言語コードのデフォルト
```typescript
// デフォルト言語で取得
const response = await fetch('/api/ranking/quiz?period=daily', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
```

## パフォーマンス
- データベースクエリを `Promise.all` で並列実行
- 削除されたデータは集計から除外
- 上位10位のみを返すことでレスポンスサイズを最小化

## ランキング表示の実装例
```typescript
function displayRanking(data: QuizRankingResponse) {
  // トップ10を表示
  data.topUsers.forEach(user => {
    const medal = user.rank <= 3 ? ['🥇', '🥈', '🥉'][user.rank - 1] : '';
    console.log(`${medal} ${user.rank}位: ${user.username} - ${user.count}問正解`);
  });
  
  // 自分の順位を表示
  if (data.currentUser) {
    if (data.currentUser.rank > 10) {
      console.log('---');
      console.log(`あなた: ${data.currentUser.rank}位 - ${data.currentUser.count}問正解`);
    }
  } else {
    console.log('まだランキングデータがありません');
  }
}
```

## 関連型定義
- `QuizRankingResponse` (内部型)
- `RankingUser` (内部型)

## 関連エンドポイント
- `GET /api/ranking/speak` - 音読練習ランキング
- `GET /api/ranking/quiz/streak` - クイズStreak ランキング
- `GET /api/ranking/phrase/streak` - フレーズStreak ランキング
