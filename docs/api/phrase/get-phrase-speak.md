# GET /api/phrase/speak

音読練習対象のフレーズを1件取得します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/phrase/speak` |
| メソッド | `GET` |
| 認証 | 必要 |
| ファイル | `src/app/api/phrase/speak/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| language | string | Yes | - | 言語コード（例: "en"） |
| excludeIfSpeakCountGTE | number | - | - | 指定回数以上の音読済みフレーズを除外 |
| excludeTodayPracticed | boolean | - | false | 今日練習済みのフレーズを除外 |

**例:**

```
GET /api/phrase/speak?language=en&excludeIfSpeakCountGTE=10&excludeTodayPracticed=true
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface SpeakPhraseResponse {
  success: true;
  phrase: {
    id: string;
    original: string;
    translation: string;
    explanation?: string;
    totalSpeakCount: number;
    dailySpeakCount: number;
    languageCode: string;
  };
}
```

**例:**

```json
{
  "success": true,
  "phrase": {
    "id": "cm1abc123",
    "original": "How are you doing?",
    "translation": "調子はどう？",
    "explanation": "カジュアルな挨拶表現",
    "totalSpeakCount": 5,
    "dailySpeakCount": 0,
    "languageCode": "en"
  }
}
```

### フレーズがない場合 (200 OK)

```json
{
  "success": false,
  "message": "No phrases available for practice in this session"
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | 言語パラメータが必要、または言語が見つからない |
| 401 | 認証エラー |
| 500 | 内部サーバーエラー |

## 実装詳細

### フィルタリング条件

| 条件 | 説明 |
|------|------|
| userId | 認証されたユーザーのフレーズのみ |
| language.code | 指定された言語のフレーズのみ |
| deletedAt: null | 削除されていないフレーズのみ |
| speechId: null | スピーチに紐づいていないフレーズのみ |
| sessionSpoken: false | セッション中に未練習のフレーズのみ |
| dailySpeakCount: 0 | `excludeTodayPracticed=true` の場合 |
| totalSpeakCount < N | `excludeIfSpeakCountGTE=N` の場合 |

### ソート順（優先度）

1. **音読回数が多い順**（復習重視）
2. 音読回数が同じ場合は**古い順**（登録日時）

```typescript
sortedPhrases.sort((a, b) => {
  // 音読回数で比較（多い順）
  if (practiceA !== practiceB) {
    return practiceB - practiceA;
  }
  // 音読回数が同じ場合は古い順
  return dateA - dateB;
});
```

### セッション管理

- `sessionSpoken` フラグで同一セッション内での重複出題を防止
- セッションリセットは `/api/phrases/reset-session` で実行

## 使用例

```typescript
// フロントエンドでの使用例
const response = await fetch(
  '/api/phrase/speak?language=en&excludeTodayPracticed=true',
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const data = await response.json();

if (data.success && data.phrase) {
  // 音読練習画面を表示
  showSpeakingPractice(data.phrase);
} else {
  // セッション完了
  showSessionComplete();
}
```

## 関連ファイル

- 型定義: `src/types/phrase.ts`
- カウント取得: `src/app/api/phrase/speak/count/route.ts`
- セッションリセット: `src/app/api/phrases/reset-session/route.ts`
