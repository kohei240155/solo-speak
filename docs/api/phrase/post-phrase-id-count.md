# POST /api/phrase/[id]/count

フレーズの音読回数を更新します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/phrase/[id]/count` |
| メソッド | `POST` |
| 認証 | 必要 |
| ファイル | `src/app/api/phrase/[id]/count/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### パスパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | string | Yes | フレーズID |

### ボディ

```typescript
interface UpdateCountRequestBody {
  count?: number;  // 増加させる回数（デフォルト: 0）
}
```

**例:**

```json
{
  "count": 1
}
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface PhraseCountResponse {
  success: true;
  phrase: {
    id: string;
    original: string;
    translation: string;
    totalSpeakCount: number;
    dailySpeakCount: number;
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
    "totalSpeakCount": 16,
    "dailySpeakCount": 4
  }
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | フレーズIDが必要 |
| 401 | 認証エラー |
| 404 | フレーズが見つからない、またはアクセス権限なし |
| 500 | 内部サーバーエラー |

## 実装詳細

### トランザクション処理

音読回数の更新とログ記録は単一トランザクションで実行されます：

```typescript
await prisma.$transaction(async (prisma) => {
  // 1. フレーズの音読回数を更新
  const phrase = await prisma.phrase.update({
    where: { id: phraseId },
    data: {
      lastSpeakDate: currentDate,
      sessionSpoken: true,
      totalSpeakCount: { increment: countIncrement },
      dailySpeakCount: { increment: countIncrement },
    },
  });

  // 2. speak_logsテーブルに記録
  await prisma.speakLog.create({
    data: {
      phraseId: phraseId,
      date: currentDate,
      count: countIncrement,
    },
  });
});
```

### 更新されるフィールド

| フィールド | 説明 |
|-----------|------|
| lastSpeakDate | 最後の音読日時 |
| sessionSpoken | セッション中に音読済みフラグ（true に設定） |
| totalSpeakCount | 累計音読回数（増加） |
| dailySpeakCount | 今日の音読回数（増加） |

### count = 0 の場合

- `sessionSpoken` を `true` に設定（次のフレーズへ進むため）
- カウントは増加しない
- ログは記録されない

### セキュリティ

- 認証されたユーザーのフレーズのみ更新可能
- 負の値は0として扱われる（`Math.max(0, count)`）

## 使用例

```typescript
// フロントエンドでの使用例
// 音読完了時に呼び出し
const response = await fetch(`/api/phrase/${phraseId}/count`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ count: 1 }),
});

const { phrase } = await response.json();
console.log(`累計${phrase.totalSpeakCount}回音読しました`);
```

## 関連ファイル

- 型定義: `src/types/phrase.ts`
- SpeakLogモデル: `prisma/schema.prisma`
