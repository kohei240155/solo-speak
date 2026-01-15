# AIプロンプト

## 概要

Solo Speakでは、OpenAI APIを使用して以下の機能を提供しています：

| 機能 | プロンプトファイル | 使用モデル | 用途 |
|------|------------------|-----------|------|
| フレーズ生成 | `src/prompts/phraseGeneration.ts` | gpt-4.1-mini | 3つの表現パターン生成 |
| スピーチ添削 | `src/prompts/speechCorrection.ts` | gpt-5-mini | スピーチの添削とフィードバック |

---

## フレーズ生成プロンプト

**ファイル**: `src/prompts/phraseGeneration.ts`

### 機能

ユーザーが入力した母国語のフレーズを、学習言語で3つの異なる表現パターンに翻訳します。

### 関数シグネチャ

```typescript
getPhraseGenerationPrompt(
  nativeLanguageName: string,  // 母国語名（例: "Japanese"）
  input: string,               // ユーザー入力文
  situation: string | undefined, // 使用状況（任意）
  learningLanguage: string,    // 学習言語名（例: "English"）
): string
```

### 使用箇所

- `src/app/api/phrase/generate/route.ts`

### プロンプトの動作

1. ユーザーの入力文と状況から意図を読み取る
2. 自然な話し言葉の表現を3つ生成
3. 各表現についてニュアンスの説明を付与

### 出力形式

Structured Outputs（Zodスキーマ）に従った形式で返却：

```typescript
{
  variations: [
    {
      original: string,     // 自然な話し言葉の表現（200文字以内）
      explanation: string,  // ニュアンスの説明（30-50文字程度）
    }
  ]  // 3つの異なる表現パターン
}
```

---

## スピーチ添削プロンプト

**ファイル**: `src/prompts/speechCorrection.ts`

### 機能

ユーザーが話した内容を添削し、自然な口語表現に修正。改善ポイントをフィードバックします。

### 関数シグネチャ

```typescript
getSpeechCorrectionPrompt(
  title: string,              // スピーチのタイトル
  speechPlanItems: string[],  // 話したい内容の箇条書き
  transcribedText: string,    // 実際に話した文章（音声認識結果）
  learningLanguage: string,   // 学習言語名
  nativeLanguage: string,     // 母国語名
): string
```

### 使用箇所

- `src/app/api/speech/correct/route.ts`

### プロンプトの動作

1. 話したい内容と実際に話した内容を比較
2. 自然な口語表現に添削
3. 添削後の文章を学習言語と母国語で出力
4. 改善ポイントを3つフィードバック

### 添削ルール

- 口語表現で適切な短縮形を使用
- 文は短めに区切り、接続詞で自然に繋ぐ
- 正しく言えている部分は変更しない
- アドリブ内容も自然な流れであれば反映

### 出力形式

```typescript
{
  sentences: [
    {
      learningLanguage: string,  // 添削後の学習言語での文（文単位）
      nativeLanguage: string,    // 添削後の母国語での翻訳（文単位）
    }
  ],
  feedback: [  // ※単数形
    {
      category: string,  // カテゴリ（英語）
      content: string,   // フィードバック内容（母国語）
    }
  ]  // 最大3項目
}
```

---

## カスタマイズ

### プロンプトの修正

プロンプトを修正する場合は、以下の点に注意してください：

1. **出力形式を変更しない**: APIルートのZodスキーマと整合性を保つ
2. **言語の動的挿入**: `${learningLanguage}` などのテンプレート変数を活用
3. **テスト**: 変更後は複数の言語ペアでテストを実施

### 新しいプロンプトの追加

1. `src/prompts/` に新しいファイルを作成
2. 関数をエクスポート
3. 対応するAPIルートから呼び出し
4. このドキュメントに追記

---

## 関連ファイル

| ファイル | 説明 |
|----------|------|
| `src/prompts/phraseGeneration.ts` | フレーズ生成プロンプト |
| `src/prompts/speechCorrection.ts` | スピーチ添削プロンプト |
| `src/app/api/phrase/generate/route.ts` | フレーズ生成API |
| `src/app/api/speech/correct/route.ts` | スピーチ添削API |
