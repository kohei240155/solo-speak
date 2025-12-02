# Speech Review API

## 概要

復習モード用のスピーチデータを取得するAPIエンドポイント。条件に基づいてフィルタリングされたスピーチデータとそれに紐づく詳細情報を取得します。

## エンドポイント

- `GET /api/speech/review` - 復習用スピーチデータ取得

## 認証

必要

---

## GET /api/speech/review

### リクエスト

#### クエリパラメータ

| パラメータ            | 型      | 必須 | デフォルト | 説明                                                                        |
| --------------------- | ------- | ---- | ---------- | --------------------------------------------------------------------------- |
| languageCode          | string  | ○    | -          | 学習言語コード（例: "en", "ja", "es"）                                      |
| speakCountFilter      | string  | -    | null       | 出題対象フィルター（"lessPractice": 練習回数少, "lowStatus": ステータス低） |
| excludeTodayPracticed | boolean | -    | true       | 今日練習したスピーチを除外するかどうか                                      |

### レスポンス

#### 成功時 (200 OK)

```typescript
interface SpeechReviewResponseData {
	success: true;
	speech: {
		id: string;
		title: string; // テーマ/タイトル
		practiceCount: number; // 練習回数
		status: {
			id: string;
			name: string; // ステータス名（例: "初級", "中級", "上級"）
			description?: string;
		};
		firstSpeechText: string; // 最初に話したときのテキスト
		audioFilePath: string | null; // 音声ファイルのURL
		notes: string | null; // メモ/Note
		lastPracticedAt: string | null; // 最後の練習日時（ISO 8601形式）
		createdAt: string; // 作成日時（ISO 8601形式）
		phrases: {
			id: string;
			original: string; // 学習言語の原文
			translation: string; // 母国語への翻訳/和訳
			speechOrder: number; // スピーチ内での順番
		}[];
		feedbacks: {
			id: string;
			category: string; // フィードバックのカテゴリー
			content: string; // フィードバック内容
			createdAt: string; // 作成日時（ISO 8601形式）
		}[];
	} | null; // 条件に合うスピーチが存在しない場合はnull
}
```

#### エラー時

##### 認証エラー (401 Unauthorized)

```json
{
	"error": "Unauthorized"
}
```

##### バリデーションエラー (400 Bad Request)

```json
{
	"error": "Language code is required"
}
```

または

```json
{
	"error": "Invalid speakCountFilter value. Must be 'lessPractice' or 'lowStatus'"
}
```

##### サーバーエラー (500 Internal Server Error)

```json
{
	"error": "Internal server error"
}
```

### 機能詳細

- 認証されたユーザーのスピーチのみを取得
- 削除されていないスピーチのみ
- 指定された学習言語のスピーチのみをフィルタリング
- 各スピーチに紐づくフレーズデータを全件取得（speechOrderでソート）
- 各スピーチに紐づくフィードバックデータを全件取得
- 音声ファイルのパスが存在する場合は完全なURLに変換して返却

## データ取得ロジック

### 1. 基本フィルタリング条件

- `userId`: 認証されたユーザー
- `learningLanguageId`: 指定された言語コードに対応する言語ID
- `deletedAt`: null（削除されていない）

### 2. 追加フィルタリング条件

#### excludeTodayPracticed = true の場合

今日練習したスピーチを除外：

```typescript
lastPracticedAt: {
  not: {
    gte: new Date(today), // 今日の0時以降
    lt: new Date(tomorrow) // 明日の0時より前
  }
}
```

または `lastPracticedAt` が null のものを含む

#### speakCountFilter の処理

##### "lessPractice" (練習回数が少ないもの)

```typescript
orderBy: {
	practiceCount: "asc"; // 練習回数の昇順
}
```

##### "lowStatus" (ステータスが低いもの)

ステータステーブルと結合し、ステータス名またはIDでソート：

```typescript
orderBy: {
	status: {
		name: "asc"; // またはステータスの優先度フィールド
	}
}
```

### 3. 結合データ

- `learningLanguage`: 学習言語情報
- `nativeLanguage`: 母国語情報
- `status`: ステータス情報
- `phrases`: 紐づくフレーズ全件（speechOrderで昇順ソート、deletedAt = null）
- `feedbacks`: 紐づくフィードバック全件（作成日時で降順ソート、deletedAt = null）

### 4. 取得件数

条件に合致するスピーチから1件のみを取得します。複数該当する場合は、上記のソート条件に基づいて最初の1件を返します。

## 使用例

### 練習回数が少ないスピーチを取得（今日練習したものを除外）

```typescript
const response = await fetch(
	"/api/speech/review?languageCode=en&speakCountFilter=lessPractice&excludeTodayPracticed=true",
	{
		headers: {
			Authorization: "Bearer YOUR_TOKEN",
		},
	},
);
const data = await response.json();
```

### ステータスが低いスピーチを取得（今日練習したものも含む）

```typescript
const response = await fetch(
	"/api/speech/review?languageCode=en&speakCountFilter=lowStatus&excludeTodayPracticed=false",
	{
		headers: {
			Authorization: "Bearer YOUR_TOKEN",
		},
	},
);
const data = await response.json();
```

### 全てのスピーチを取得（フィルターなし）

```typescript
const response = await fetch(
	"/api/speech/review?languageCode=en&excludeTodayPracticed=false",
	{
		headers: {
			Authorization: "Bearer YOUR_TOKEN",
		},
	},
);
const data = await response.json();
```

## フロントエンド利用イメージ

復習モード画面では以下の流れで使用：

1. **モーダルで条件選択**
   - 言語選択
   - 出題対象選択（練習回数少 / ステータス低）
   - 今日練習したものを除外するかのチェックボックス

2. **API呼び出し**
   - 選択された条件でAPIリクエスト

3. **取得データの利用**
   - タイトル表示
   - 練習回数、ステータス表示
   - 最初のスピーチテキスト表示
   - 音声再生機能
   - フレーズ一覧表示（原文と和訳）
   - フィードバック表示
   - メモ表示・編集

## 注意事項

- 音声ファイルのパスは、Supabase Storageなどの実際のURLに変換して返却する必要があります
- フィルター条件によっては該当するスピーチが存在しない場合があり、その場合は `speech: null` を返します
- 条件に合致するスピーチが複数ある場合は、ソート条件に基づいて最初の1件のみを返します
- フレーズとフィードバックのデータ量が多い場合、レスポンスサイズが大きくなる可能性があります

## データベースクエリの最適化

以下のインデックスを検討：

```sql
-- Speechテーブル
CREATE INDEX idx_speeches_user_language_practice ON speeches(user_id, learning_language_id, practice_count);
CREATE INDEX idx_speeches_user_language_status ON speeches(user_id, learning_language_id, status_id);
CREATE INDEX idx_speeches_last_practiced ON speeches(last_practiced_at);

-- Phraseテーブル
CREATE INDEX idx_phrases_speech_order ON phrases(speech_id, speech_order) WHERE deleted_at IS NULL;

-- SpeechFeedbackテーブル
CREATE INDEX idx_speech_feedbacks_speech ON speech_feedbacks(speech_id, created_at DESC) WHERE deleted_at IS NULL;
```

## 将来的な拡張案

- ページネーション対応（無限スクロールなど）
- より詳細なフィルター条件（日付範囲、ステータス複数選択など）
- ソート順のカスタマイズ
- お気に入りフラグなどの追加
