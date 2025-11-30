# Speech List API

## 概要

スピーチの一覧を取得するAPIエンドポイント。無限スクロール対応でページネーション形式で取得します。

## エンドポイント

- `GET /api/speech` - スピーチ一覧取得

## 認証

必要

---

## GET /api/speech

### リクエスト

#### クエリパラメータ

| パラメータ   | 型     | 必須 | デフォルト | 説明                                   |
| ------------ | ------ | ---- | ---------- | -------------------------------------- |
| languageCode | string | ○    | -          | 学習言語コード（例: "en", "ja", "es"） |
| page         | number | -    | 1          | ページ番号                             |
| limit        | number | -    | 10         | 1ページあたりの件数                    |

### レスポンス

#### 成功時 (200 OK)

```typescript
interface SpeechListResponseData {
	success: true;
	speeches: {
		id: string;
		title: string; // テーマ
		firstPhrase: {
			original: string; // 学習言語の1フレーズ目
		};
		practiceCount: number; // 練習回数
		status: {
			id: string;
			name: string; // ステータス名
			description?: string;
		};
		lastPracticedAt: string | null; // 最後の練習日時（ISO 8601形式）
		createdAt: string; // 作成日時（ISO 8601形式）
	}[];
	pagination: {
		total: number; // 総件数
		limit: number; // 1ページあたりの件数
		page: number; // 現在のページ番号
		hasMore: boolean; // 次ページがあるか
	};
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
- 作成日時の降順でソート（新しいものが先頭）
- ページネーション対応（無限スクロール実装用）
- 各スピーチに紐づく最初のフレーズ（speechOrder = 1）を含む
- lastPracticedAtが存在する場合は練習日付として使用

## データ取得ロジック

1. **フィルタリング条件**
   - `userId`: 認証されたユーザー
   - `learningLanguageId`: 指定された言語コードに対応する言語ID
   - `deletedAt`: null（削除されていない）

2. **並び順**
   - `createdAt DESC`: 作成日時の降順

3. **結合データ**
   - `learningLanguage`: 学習言語情報
   - `status`: ステータス情報
   - `phrases`: 紐づくフレーズ（speechOrder = 1のみ取得）

4. **ページネーション**
   - `skip`: (page - 1) \* limit
   - `take`: limit

## 使用例

### 初回読み込み

```typescript
const response = await fetch("/api/speech?languageCode=en&page=1&limit=10", {
	headers: {
		Authorization: "Bearer YOUR_TOKEN",
	},
});
const data = await response.json();
```

### 無限スクロール（次ページ読み込み）

```typescript
const response = await fetch("/api/speech?languageCode=en&page=2&limit=10", {
	headers: {
		Authorization: "Bearer YOUR_TOKEN",
	},
});
const data = await response.json();

if (data.pagination.hasMore) {
	// 次のページが存在する
}
```

## フロントエンド表示項目

Speech一覧画面では以下の項目を表示：

1. **テーマ (title)**
   - スピーチのタイトル

2. **学習言語の1フレーズ目 (firstPhrase.original)**
   - speechOrderが1のフレーズの学習言語テキスト
   - プレビューとして表示

3. **練習回数 (practiceCount)**
   - スピーチの練習回数
   - 0から始まる整数値

4. **ステータス (status.name)**
   - スピーチの現在のステータス
   - 例: "draft", "completed", "in-progress"

5. **練習日付 (lastPracticedAt または createdAt)**
   - 最後に練習した日時（lastPracticedAtがある場合）
   - なければ作成日時（createdAt）を表示
   - フォーマット例: "2024/01/15"

## 関連型定義

### TypeScript型定義

```typescript
// src/types/speech.ts

export interface SpeechListItem {
	id: string;
	title: string;
	firstPhrase: {
		original: string;
	};
	practiceCount: number;
	status: {
		id: string;
		name: string;
		description?: string;
	};
	lastPracticedAt: string | null;
	createdAt: string;
}

export interface PaginationData {
	total: number;
	limit: number;
	page: number;
	hasMore: boolean;
}

export interface SpeechListResponseData {
	success: true;
	speeches: SpeechListItem[];
	pagination: PaginationData;
}
```

## データベースクエリ例

```typescript
const speeches = await prisma.speech.findMany({
	where: {
		userId,
		learningLanguageId: language.id,
		deletedAt: null,
	},
	include: {
		status: true,
		learningLanguage: true,
		phrases: {
			where: {
				speechOrder: 1,
				deletedAt: null,
			},
			select: {
				original: true,
			},
			take: 1,
		},
	},
	orderBy: {
		createdAt: "desc",
	},
	skip: (page - 1) * limit,
	take: limit,
});

const total = await prisma.speech.count({
	where: {
		userId,
		learningLanguageId: language.id,
		deletedAt: null,
	},
});
```

## PhraseListとの類似点

このAPIは `/api/phrase` (GET) と同様の設計パターンを採用：

1. **無限スクロール対応**
   - ページネーション形式
   - hasMoreフラグで次ページの存在を判定

2. **言語フィルタリング**
   - languageCodeパラメータで言語を指定
   - ユーザーごとの言語別データ取得

3. **レスポンス構造**
   - success: true
   - データ配列
   - paginationオブジェクト

4. **並び順**
   - 作成日時の降順（新しいものが先頭）

## 実装時の注意点

1. **パフォーマンス**
   - phrasesの取得は最初の1つのみ（speechOrder = 1）
   - 必要最小限のフィールドのみ取得

2. **エラーハンドリング**
   - 言語コードのバリデーション
   - 存在しない言語コードの場合は400エラー
   - 認証エラーは401

3. **日付フォーマット**
   - ISO 8601形式で返却
   - フロントエンドで表示用にフォーマット

4. **削除済みデータの除外**
   - deletedAt: null でフィルタリング
   - スピーチとフレーズ両方で除外条件を適用
