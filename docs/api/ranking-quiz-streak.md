# Ranking Quiz Streak API

## 概要
クイズの連続日数（Streak）に基づくランキングを取得するAPIエンドポイント。

## エンドポイント
`GET /api/ranking/quiz/streak`

## 認証
必要

## リクエスト

### クエリパラメータ
| パラメータ | 型 | 必須 | デフォルト | 説明 |
|----------|-----|------|-----------|------|
| language | string | - | デフォルト言語 | 言語コード（例: "en", "ja"） |

## レスポンス

### 成功時 (200 OK)
```typescript
interface QuizStreakRankingResponse {
  success: true;
  topUsers: StreakRankingUser[];      // 上位10位まで
  currentUser: StreakRankingUser | null; // ログインユーザーの順位（圏外含む）
}

interface StreakRankingUser {
  rank: number;           // 順位
  userId: string;         // ユーザーID
  username: string;       // ユーザー名
  iconUrl: string | null; // アイコンURL
  streakDays: number;     // 連続日数
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
  "error": "Internal server error"
}
```

## 機能詳細

### Streak（連続日数）の計算
1. ユーザーの全クイズ結果（`quizResults`）から日付を収集
2. 日付を文字列形式（YYYY-MM-DD）に変換
3. `calculateStreak` 関数で連続日数を計算
   - 今日から遡って連続している日数をカウント
   - 1日でも途切れると Streak は終了

### ランキング対象
- 指定言語でクイズを実施したことがあるユーザー
- Streak が 1日以上のユーザーのみ（0日は除外）
- 削除されていないユーザー、フレーズ、クイズ結果のみ

### ランキング順位の決定
1. **Streak日数**: 長い順
2. **登録日時**: 同数の場合、アカウント作成日が古い方が上位

### 取得データ
- **topUsers**: 上位10位までのユーザー
- **currentUser**: ログインユーザーの順位
  - 10位以内: `topUsers` に含まれる
  - 11位以降: 全データから順位を計算して返す
  - Streak が0または未記録: null

## Streak 計算ロジック詳細

### 連続日数の定義
- 今日を含めて過去何日連続でクイズを実施したか
- 1日でも途切れると Streak はリセット

### 計算例
```
今日: 2024-01-15

クイズ実施日: 2024-01-15, 2024-01-14, 2024-01-13, 2024-01-10
→ Streak: 3日（15, 14, 13日は連続だが、12日が抜けているため）

クイズ実施日: 2024-01-15, 2024-01-14, 2024-01-13, 2024-01-12
→ Streak: 4日（すべて連続）

クイズ実施日: 2024-01-14, 2024-01-13, 2024-01-12
→ Streak: 0日（今日が含まれていない）
```

## 使用例

### 基本的な使用
```typescript
const response = await fetch('/api/ranking/quiz/streak?language=en', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
const data = await response.json();

console.log('トップ10:', data.topUsers);
console.log('自分のStreak:', data.currentUser?.streakDays);
```

### ランキング表示
```typescript
function displayStreakRanking(data: QuizStreakRankingResponse) {
  console.log('=== クイズ Streak ランキング ===');
  
  data.topUsers.forEach(user => {
    const medal = user.rank <= 3 ? ['🥇', '🥈', '🥉'][user.rank - 1] : '';
    const fire = user.streakDays >= 7 ? '🔥' : '';
    console.log(
      `${medal} ${user.rank}位: ${user.username} - ${user.streakDays}日連続 ${fire}`
    );
  });
  
  if (data.currentUser) {
    if (data.currentUser.rank > 10) {
      console.log('---');
      console.log(
        `あなた: ${data.currentUser.rank}位 - ${data.currentUser.streakDays}日連続`
      );
    }
  } else {
    console.log('まだStreakがありません。今日からクイズを始めましょう！');
  }
}
```

### モチベーション表示
```typescript
async function showStreakMotivation() {
  const response = await fetch('/api/ranking/quiz/streak?language=en', {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  });
  const { currentUser } = await response.json();
  
  if (currentUser) {
    const days = currentUser.streakDays;
    if (days >= 30) {
      console.log('🏆 素晴らしい！30日連続達成！');
    } else if (days >= 7) {
      console.log('🔥 1週間連続達成！この調子！');
    } else if (days >= 1) {
      console.log(`💪 ${days}日連続！継続は力なり！`);
    }
  }
}
```

## パフォーマンス
- ユーザーごとにクイズ結果を取得して Streak を計算
- 削除されたデータは集計から除外
- Streak が0のユーザーはランキングから除外

## Streak を伸ばすコツ
- 毎日少なくとも1問クイズを解く
- 深夜0時（UTC）を跨ぐ前に実施
- リマインダーを設定して習慣化

## 関連ユーティリティ
- `calculateStreak` (`@/utils/streak-calculator`)
- `formatDatesToStrings` (`@/utils/streak-calculator`)

## 関連エンドポイント
- `GET /api/ranking/quiz` - クイズ正解数ランキング
- `GET /api/ranking/phrase/streak` - フレーズStreak ランキング
- `GET /api/ranking/speak` - 音読練習ランキング
