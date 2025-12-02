# Speech Save API

## 概要

スピーチ結果を保存するAPIエンドポイント。スピーチのタイトル、プラン、音声、フレーズ、フィードバックを一括で保存します。

## エンドポイント

- `POST /api/speech/save` - スピーチ結果保存

## 認証

必要

---

## POST /api/speech/save

### 説明

ユーザーのスピーチ練習結果を保存します。以下のデータを含みます：

- スピーチの基本情報（タイトル、言語、初回スピーチテキスト、音声ファイル）
- スピーチプラン（複数）
- フレーズ（複数の文章とその翻訳）
- フィードバック（複数のカテゴリ別フィードバック）

### リクエスト

#### リクエストボディ

```typescript
interface SaveSpeechRequestBody {
	// スピーチ基本情報
	title: string; // スピーチタイトル（必須、1-200文字）
	learningLanguageId: string; // 学習言語ID（必須）
	nativeLanguageId: string; // 母国語ID（必須）
	firstSpeechText: string; // 最初に話したスピーチテキスト（必須）
	notes?: string; // メモ（任意）

	// スピーチプラン
	speechPlans: string[]; // スピーチプランの配列（必須、最低1つ）

	// フレーズ（文章）
	sentences: Array<{
		learningLanguage: string; // 学習言語での文章（必須、1-500文字）
		nativeLanguage: string; // 母国語での翻訳（必須、1-500文字）
	}>; // 最低1つ必須

	// フィードバック
	feedback: Array<{
		category: string; // フィードバックカテゴリ（必須、1-100文字）
		content: string; // フィードバック内容（必須、1-2000文字）
	}>; // 任意
}
```

### レスポンス

#### 成功時 (201 Created)

```typescript
interface SaveSpeechResponseData {
	success: true;
	speech: {
		id: string;
		title: string;
		learningLanguage: {
			id: string;
			name: string;
			code: string;
		};
		nativeLanguage: {
			id: string;
			name: string;
			code: string;
		};
		firstSpeechText: string;
		notes?: string;
		status: {
			id: string;
			name: string;
			description?: string;
		};
		practiceCount: number;
		createdAt: string; // ISO 8601形式
		updatedAt: string; // ISO 8601形式
	};
	phrases: Array<{
		id: string;
		original: string; // 学習言語での文章
		translation: string; // 母国語での翻訳
		speechOrder: number; // スピーチ内での順序（1から始まる）
		createdAt: string;
	}>;
	speechPlans: Array<{
		id: string;
		planningContent: string;
		createdAt: string;
	}>;
	feedbacks: Array<{
		id: string;
		category: string;
		content: string;
		createdAt: string;
	}>;
	remainingSpeechCount: number; // 残りのスピーチ回数
}
```

#### エラー時

##### 認証エラー (401 Unauthorized)

```typescript
{
	error: "Unauthorized";
}
```

##### バリデーションエラー (400 Bad Request)

```typescript
{
	error: string; // エラーメッセージ
}
```

**バリデーションエラーの例:**

- `"Title is required"` - タイトルが空
- `"Title must be between 1 and 200 characters"` - タイトルの長さが不正
- `"Learning language ID is required"` - 学習言語IDが未指定
- `"Native language ID is required"` - 母国語IDが未指定
- `"First speech text is required"` - 初回スピーチテキストが空
- `"At least one speech plan is required"` - スピーチプランが空
- `"At least one sentence is required"` - フレーズが空
- `"Invalid language ID"` - 言語IDが存在しない
- `"Sentence must have both learning and native language text"` - フレーズに必須項目が不足
- `"Learning language text must be between 1 and 500 characters"` - 学習言語テキストの長さが不正
- `"Native language text must be between 1 and 500 characters"` - 母国語テキストの長さが不正
- `"Feedback category must be between 1 and 100 characters"` - フィードバックカテゴリの長さが不正
- `"Feedback content must be between 1 and 2000 characters"` - フィードバック内容の長さが不正
- `"No remaining speech count"` - スピーチ回数が残っていない

##### 言語が見つからない (404 Not Found)

```typescript
{
	error: "Learning language not found" | "Native language not found";
}
```

##### サーバーエラー (500 Internal Server Error)

```typescript
{
	error: "Failed to save speech";
}
```

---

## データベーストランザクション

このAPIは以下の順序でデータを保存します：

1. **Speechレコードの作成**
   - ユーザーID、タイトル、言語、初回スピーチテキスト、ステータスを保存
   - ステータスは初期状態として設定（例: "draft" または "completed"）

2. **SpeechPlanレコードの作成**
   - 各スピーチプランを保存（speechIdと紐付け）

3. **Phraseレコードの作成**
   - 各フレーズを保存（speechId、speechOrder、phraseLevelIdと紐付け）
   - phraseLevelIdはデフォルトレベルを使用
   - languageIdは学習言語IDを使用

4. **SpeechFeedbackレコードの作成**
   - 各フィードバックを保存（speechIdと紐付け）

5. **Userの残りスピーチ回数を減算**
   - `remainingSpeechCount`を1減らす
   - 0未満にはならないようにチェック

すべての操作はトランザクション内で実行され、エラーが発生した場合はロールバックされます。

---

## 使用例

### クライアント側の実装例

```typescript
const saveSpeech = async (speechData: {
	title: string;
	learningLanguageId: string;
	nativeLanguageId: string;
	firstSpeechText: string;
	notes?: string;
	speechPlans: string[];
	sentences: Array<{
		learningLanguage: string;
		nativeLanguage: string;
	}>;
	feedback: Array<{
		category: string;
		content: string;
	}>;
}) => {
	const response = await fetch("/api/speech/save", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(speechData),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error);
	}

	return await response.json();
};
```

---

## 注意事項

1. **認証必須**: このAPIはログインユーザーのみ使用可能
2. **スピーチ回数制限**: ユーザーの`remainingSpeechCount`が0の場合は保存できない
3. **トランザクション**: すべてのデータ保存は単一のトランザクション内で実行される
4. **フレーズの順序**: フレーズは配列の順序に従って`speechOrder`が自動的に割り当てられる（1から開始）
5. **デフォルトレベル**: 新規作成されるフレーズには自動的にデフォルトのphraseLevelIdが設定される

---

## 関連テーブル

### Speech

- メインのスピーチレコード
- ユーザー、言語、ステータスとリレーション

### SpeechPlan

- スピーチの計画内容
- 1つのSpeechに対して複数存在可能

### Phrase

- スピーチ内の個別の文章
- speechId、speechOrderで紐付け
- 学習言語と翻訳を含む

### SpeechFeedback

- AIからのフィードバック
- カテゴリごとに整理

### SpeechStatus

- スピーチのステータス管理
- 例: "draft", "completed", "archived"など
