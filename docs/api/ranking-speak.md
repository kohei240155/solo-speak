# Ranking Speak API

## 概要
音読練習回数に基づくランキングを取得するAPIエンドポイント。

## エンドポイント
`GET /api/ranking/speak`

## 認証
必要

## リクエスト

### クエリパラメータ
| パラメータ | 型 | 必須 | デフォルト | 説明 |
|----------|-----|------|-----------|------|
| language | string | - | デフォルト言語 | 言語コード（例: "en", "ja"） |
| period | string | - | "daily" | "daily", "weekly", "monthly" |

## レスポンス

### 成功時 (200 OK)
```typescript
interface SpeakRankingResponseData {
  success: true;
  topUsers: SpeakRankingUser[];      // 上位10位まで
  currentUser: SpeakRankingUser | null; // ログインユーザーの順位（圏外含む）
}

interface SpeakRankingUser {
  rank: number;           // 順位
  userId: string;         // ユーザーID
  username: string;       // ユーザー名
  iconUrl: string | null; // アイコンURL
  count: number;          // 音読回数
}
```

### エラー時

#### 言語が見つからない (400 Bad Request)
```json
{
  "error": "Language not found"
}
```

#### サーバーエラー (500 Internal Server Error)
```json
{
  "error": "Internal server error",
  "details": "エラー詳細"
}
```

## 機能詳細

### 期間設定

#### Daily（今日）
- 当日（UTC基準）の音読回数でランキング
- 開始時刻: 今日の 00:00:00 UTC

#### Weekly（1週間）
- 過去7日間の音読回数でランキング
- 開始時刻: 現在時刻 - 7日

#### Monthly（全期間として扱われる）
※コードでは "monthly" も total と同じ扱い
- 全期間の音読回数でランキング
- 開始時刻: 1970-01-01

### 集計ロジック
1. 指定期間内の `speakLogs` テーブルからデータを取得
2. ユーザーごとに音読回数（`count`）を合計
3. 削除されていないログとフレーズのみを対象

### ランキング順位の決定
1. **音読回数**: 多い順
2. **登録日時**: 同数の場合、アカウント作成日が古い方が上位

### 取得データ
- **topUsers**: 上位10位までのユーザー
- **currentUser**: ログインユーザーの順位
  - 10位以内: `topUsers` に含まれる
  - 11位以降: 全データから順位を計算して返す
  - データなし: null

## 音読回数のカウント方法
`speakLogs` テーブルの `count` フィールドを合計：
- 1回の音読練習で複数回カウントされる場合あり
- `/api/phrase/[id]/count` で記録される値

## 使用例

### 今日のランキング
```typescript
const response = await fetch('/api/ranking/speak?language=en&period=daily', {
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
const response = await fetch('/api/ranking/speak?language=en&period=monthly', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
const { topUsers, currentUser } = await response.json();

topUsers.forEach(user => {
  console.log(`${user.rank}位: ${user.username} (${user.count}回)`);
});

if (currentUser && currentUser.rank > 10) {
  console.log(`あなたの順位: ${currentUser.rank}位 (${currentUser.count}回)`);
}
```

### ランキング表示の実装
```typescript
function displaySpeakRanking(data: SpeakRankingResponseData, period: string) {
  const periodText = {
    daily: '今日',
    weekly: '今週',
    monthly: '全期間'
  }[period] || period;
  
  console.log(`=== 音読練習ランキング (${periodText}) ===`);
  
  data.topUsers.forEach(user => {
    const medal = user.rank <= 3 ? ['🥇', '🥈', '🥉'][user.rank - 1] : '';
    console.log(
      `${medal} ${user.rank}位: ${user.username} - ${user.count}回`
    );
  });
  
  if (data.currentUser) {
    if (data.currentUser.rank > 10) {
      console.log('---');
      console.log(
        `あなた: ${data.currentUser.rank}位 - ${data.currentUser.count}回`
      );
    }
  } else {
    console.log('まだランキングデータがありません');
  }
}
```

### 目標設定の実装
```typescript
async function showDailyGoal() {
  const response = await fetch('/api/ranking/speak?language=en&period=daily', {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  });
  const { currentUser, topUsers } = await response.json();
  
  const myCount = currentUser?.count || 0;
  const topCount = topUsers[0]?.count || 0;
  
  console.log(`今日の練習回数: ${myCount}回`);
  console.log(`1位との差: ${topCount - myCount}回`);
  
  if (myCount === 0) {
    console.log('💪 今日はまだ練習していません。始めましょう！');
  } else if (myCount < 10) {
    console.log('👍 良いスタート！10回を目指しましょう！');
  } else if (myCount < 50) {
    console.log('🔥 素晴らしい！この調子で継続しましょう！');
  } else {
    console.log('🏆 すごい！50回以上達成！');
  }
}
```

## パフォーマンス
- データベースクエリを `Promise.all` で並列実行
- 削除されたデータは集計から除外
- 上位10位のみを返すことでレスポンスサイズを最小化

## 他のランキングとの比較

| ランキング | 対象 | 更新頻度 | 達成難易度 |
|-----------|------|---------|----------|
| Speak | 音読回数 | リアルタイム | 中（練習量に応じる） |
| Quiz | クイズ正解数 | リアルタイム | 中（知識に応じる） |
| Quiz Streak | クイズ連続日数 | 日次 | 高（毎日必要） |
| Phrase Streak | フレーズ作成連続日数 | 日次 | 中（毎日1個作成） |

## 関連型定義
- `SpeakRankingResponseData` (`@/types/ranking`)
- `RankingQueryParams` (`@/types/ranking`)
- `ApiErrorResponse` (`@/types/api`)

## 関連エンドポイント
- `GET /api/ranking/quiz` - クイズ正解数ランキング
- `GET /api/ranking/quiz/streak` - クイズStreak ランキング
- `GET /api/ranking/phrase/streak` - フレーズStreak ランキング
- `POST /api/phrase/[id]/count` - 音読回数記録
