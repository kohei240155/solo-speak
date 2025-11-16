# Phrase Generate API

## 概要
AIを使用してフレーズのバリエーションを生成するAPIエンドポイント。

## エンドポイント
`POST /api/phrase/generate`

## 認証
必要

## リクエスト

### リクエストボディ
```typescript
interface GeneratePhraseRequest {
  nativeLanguage: string;      // 母国語コード
  learningLanguage: string;    // 学習言語コード
  desiredPhrase: string;       // 生成したいフレーズ（1-100文字）
  selectedContext?: string | null; // 選択されたコンテキスト（任意）
}
```

## レスポンス

### 成功時 (200 OK)
```typescript
interface GeneratePhraseResponse {
  variations: PhraseVariation[];
}

interface PhraseVariation {
  original: string;       // 生成されたフレーズ（200文字以内）
  explanation?: string;   // ニュアンスの説明（30-50文字程度）
}
```

レスポンスには必ず **3つのバリエーション** が含まれます。

### エラー時
```json
{
  "error": "エラーメッセージ",
  "details": [] // バリデーションエラー時のみ
}
```

**エラーコード:**
- `400` - バリデーションエラー（リクエストデータが不正）
- `403` - 残り生成回数が0（1日の上限に達している）
- `404` - ユーザーが見つからない
- `500` - サーバーエラーまたはOpenAI API エラー

## 機能詳細

### AI生成
- OpenAI GPT-4.1-mini を使用
- Structured Outputs 機能で構造化されたレスポンスを保証
- 同じ意味を持つ3つの異なる表現パターンを生成
- 各バリエーションにニュアンスの違いを示す説明が含まれる

### 生成回数管理
- 生成成功時に `remainingPhraseGenerations` を1減らす
- 残り回数が0の場合はエラーを返す
- カウント更新エラーが発生しても生成結果は返される

### バリデーション
- `nativeLanguage`: 必須、1文字以上
- `learningLanguage`: 必須、1文字以上
- `desiredPhrase`: 必須、1-100文字
- `selectedContext`: 任意、null許可

### 国際化対応
- リクエストヘッダーから言語を検出
- エラーメッセージは検出された言語で返される

## プロンプトテンプレート
生成には言語ごとに最適化されたプロンプトテンプレートを使用（`@/prompts` から取得）。

## 使用例
```typescript
const response = await fetch('/api/phrase/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nativeLanguage: 'ja',
    learningLanguage: 'en',
    desiredPhrase: '元気ですか？',
    selectedContext: 'カジュアルな会話'
  })
});
const { variations } = await response.json();
```

## レート制限
- 1日あたりの生成回数に制限あり（サブスクリプションプランにより異なる）
- 残り回数は `/api/phrase/remaining` で確認可能

## 環境変数
- `OPENAI_API_KEY`: OpenAI API キー（必須）

## 関連型定義
- `GeneratePhraseRequest` (内部型)
- `GeneratePhraseResponse` (内部型)
- `PhraseVariation` (内部型)

## 関連エンドポイント
- `GET /api/phrase/remaining` - 残り生成回数取得
- `POST /api/phrase` - フレーズ作成
