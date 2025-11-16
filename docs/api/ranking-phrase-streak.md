# Ranking Phrase Streak API

## 概要
フレーズ作成の連続日数（Streak）に基づくランキングを取得するAPIエンドポイント。

## エンドポイント
`GET /api/ranking/phrase/streak`

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
interface PhraseStreakRankingResponse {
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
1. ユーザーの全フレーズ（`phrases`）から作成日（`createdAt`）を収集
2. 日付を文字列形式（YYYY-MM-DD）に変換
3. `calculateStreak` 関数で連続日数を計算
   - 今日から遡って連続している日数をカウント
   - 1日でも途切れると Streak は終了

### ランキング対象
- 指定言語でフレーズを作成したことがあるユーザー
- Streak が 1日以上のユーザーのみ（0日は除外）
- 削除されていないユーザーとフレーズのみ

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
- 今日を含めて過去何日連続でフレーズを作成したか
- 1日でも途切れると Streak はリセット

### 計算例
```
今日: 2024-01-15

フレーズ作成日: 2024-01-15, 2024-01-14, 2024-01-13, 2024-01-10
→ Streak: 3日（15, 14, 13日は連続だが、12日が抜けているため）

フレーズ作成日: 2024-01-15, 2024-01-14, 2024-01-13, 2024-01-12
→ Streak: 4日（すべて連続）

フレーズ作成日: 2024-01-14, 2024-01-13, 2024-01-12
→ Streak: 0日（今日が含まれていない）
```

### 複数フレーズ作成日
同じ日に複数のフレーズを作成しても、Streak の計算上は1日としてカウントされます。

## 使用例

### 基本的な使用
```typescript
const response = await fetch('/api/ranking/phrase/streak?language=en', {
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
function displayPhraseStreakRanking(data: PhraseStreakRankingResponse) {
  console.log('=== フレーズ作成 Streak ランキング ===');
  
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
    console.log('まだStreakがありません。今日からフレーズを作成しましょう！');
  }
}
```

### 進捗トラッキング
```typescript
async function trackPhraseStreak() {
  const response = await fetch('/api/ranking/phrase/streak?language=en', {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  });
  const { currentUser, topUsers } = await response.json();
  
  if (currentUser) {
    const days = currentUser.streakDays;
    const topStreak = topUsers[0]?.streakDays || 0;
    
    console.log(`現在のStreak: ${days}日`);
    console.log(`トップとの差: ${topStreak - days}日`);
    
    if (days >= 30) {
      console.log('🏆 1ヶ月連続達成！素晴らしい！');
    } else if (days >= 7) {
      console.log('🔥 1週間連続達成！継続中！');
    } else if (days >= 1) {
      console.log(`💪 ${days}日連続！この調子！`);
    }
  } else {
    console.log('今日フレーズを作成してStreakを始めましょう！');
  }
}
```

## Quiz Streak との違い

| 項目 | Phrase Streak | Quiz Streak |
|------|--------------|-------------|
| 対象 | フレーズ作成日 | クイズ実施日 |
| データソース | `phrases.createdAt` | `quizResults.date` |
| 目的 | フレーズ作成の習慣化 | クイズ学習の習慣化 |
| 難易度 | 比較的容易（1つ作成すればOK） | 難しい（毎日解く必要がある） |

## Streak を伸ばすコツ
- 毎日少なくとも1つのフレーズを作成
- AI生成機能を活用して簡単に作成
- 深夜0時（UTC）を跨ぐ前に実施
- リマインダーを設定して習慣化

## パフォーマンス
- ユーザーごとにフレーズ作成日を取得して Streak を計算
- 削除されたデータは集計から除外
- Streak が0のユーザーはランキングから除外

## 関連ユーティリティ
- `calculateStreak` (`@/utils/streak-calculator`)
- `formatDatesToStrings` (`@/utils/streak-calculator`)

## 関連エンドポイント
- `GET /api/ranking/quiz/streak` - クイズStreak ランキング
- `GET /api/ranking/quiz` - クイズ正解数ランキング
- `GET /api/ranking/speak` - 音読練習ランキング
- `POST /api/phrase` - フレーズ作成（Streakに影響）
