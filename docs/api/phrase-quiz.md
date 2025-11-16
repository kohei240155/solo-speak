# Phrase Quiz API

## 概要
クイズ用のフレーズリストを取得するAPIエンドポイント。モードに応じてフレーズを選択・ソートします。

## エンドポイント
`GET /api/phrase/quiz`

## 認証
必要

## リクエスト

### クエリパラメータ
| パラメータ | 型 | 必須 | デフォルト | 説明 |
|----------|-----|------|-----------|------|
| language | string | ✓ | - | 言語コード（例: "en", "ja"） |
| mode | string | ✓ | - | "normal" または "random" |
| count | number | - | 10 | 取得する問題数 |
| speakCountFilter | number | - | - | 最低音読回数（この回数以上のフレーズのみ） |
| excludeTodayQuizzed | boolean | - | false | 今日出題済みを除外 |

## レスポンス

### 成功時 (200 OK)
```typescript
interface QuizPhraseResponse {
  success: true;
  phrases: {
    id: string;
    original: string;          // 原文
    translation: string;       // 翻訳
    languageCode: string;      // 言語コード
    correctQuizCount: number;  // 正解回数
    totalSpeakCount: number;   // 音読回数
  }[];
  totalCount: number;          // 取得したフレーズ数
  availablePhraseCount: number; // 登録されているフレーズ総数
}
```

### フレーズがない場合 (200 OK)
```json
{
  "success": false,
  "message": "No phrases found for the specified language: en"
}
```

### エラー時

#### パラメータ不足 (400 Bad Request)
```json
{
  "error": "Language parameter is required"
}
// または
{
  "error": "Mode parameter is required and must be either \"normal\" or \"random\""
}
```

#### 言語が見つからない (200 OK)
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

### モード

#### Normal モード (`mode=normal`)
優先度に基づいてフレーズを選択：
1. **正解数が少ない順**: 正解回数が少ないフレーズを優先
2. **登録日時が古い順**: 正解数が同じ場合は古いものを優先

まだ正解していないフレーズや苦手なフレーズから出題されます。

#### Random モード (`mode=random`)
- Fisher-Yates シャッフルアルゴリズムで完全ランダム化
- 重複なしで指定された問題数だけ選択
- すべてのフレーズが平等に選ばれる確率

### フィルタリング条件
以下の条件を満たすフレーズのみを対象：
- 認証されたユーザーのフレーズ
- 指定された言語のフレーズ
- 削除されていないフレーズ（`deletedAt: null`）
- オプション: 指定された最低音読回数以上（`speakCountFilter`）
- オプション: 今日出題されていないフレーズ（`excludeTodayQuizzed=true`）

### 今日出題済み除外ロジック
`excludeTodayQuizzed=true` の場合、以下のフレーズのみ取得：
- `lastQuizDate` が null（一度も出題されていない）
- `lastQuizDate` が今日より前（UTC基準）

### 問題数の決定
- リクエストされた `count` とフレーズ総数の小さい方
- デフォルトは10問
- 利用可能なフレーズ数より多い問題数は自動調整

## 使用例

### 通常モード（10問）
```typescript
const response = await fetch('/api/phrase/quiz?language=en&mode=normal', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
const data = await response.json();
```

### ランダムモード（20問）
```typescript
const response = await fetch('/api/phrase/quiz?language=en&mode=random&count=20', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
```

### 音読済みフレーズのみ（5回以上音読）
```typescript
const response = await fetch(
  '/api/phrase/quiz?language=en&mode=normal&speakCountFilter=5',
  {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  }
);
```

### 今日出題していないフレーズのみ
```typescript
const response = await fetch(
  '/api/phrase/quiz?language=en&mode=normal&excludeTodayQuizzed=true',
  {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  }
);
```

### 組み合わせ
```typescript
// 10回以上音読済みで、今日出題していない15問をランダムで取得
const response = await fetch(
  '/api/phrase/quiz?language=en&mode=random&count=15&speakCountFilter=10&excludeTodayQuizzed=true',
  {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  }
);
```

## パフォーマンス
- データベースクエリを `Promise.all` で並列実行
- フィルタリングはデータベースレベルで実行
- ソートとシャッフルはメモリ内で実行

## 関連型定義
- `QuizPhraseResponse` (内部型)

## 関連エンドポイント
- `POST /api/phrase/[id]/quiz` - クイズ結果記録（このエンドポイントは存在しない可能性あり）
