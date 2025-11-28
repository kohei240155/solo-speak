# API クライアントとデータフェッチングの使用ガイド

## 概要

このプロジェクトでは、API呼び出しを簡潔にし、データの状態管理を効率化するために以下のツールを導入しました：

1. **汎用APIクライアント** (`src/utils/api.ts`) - 認証とエラーハンドリングを含む統一されたAPI呼び出し
2. **APIフック** (`src/hooks/api/`) - データキャッシュと状態管理
3. **APIヘルパー関数** (`src/hooks/useApi.ts`) - 一回限りのAPI呼び出し用

## 使用方法

### 1. 汎用APIクライアント

```typescript
import { api } from "@/utils/api";

// GET リクエスト
const data = await api.get("/api/user/settings");

// POST リクエスト
const result = await api.post("/api/phrase", {
	japanese: "こんにちは",
	english: "Hello",
});

// PUT リクエスト
const updated = await api.put("/api/phrase/123", {
	japanese: "更新されたテキスト",
});

// DELETE リクエスト
await api.delete("/api/phrase/123");
```

### 2. APIフックを使ったデータ取得とキャッシュ

```typescript
import { useUserSettingsData, useLanguages, useDashboardData } from '@/hooks/api'

function MyComponent() {
  // ユーザー設定を取得（キャッシュ付き）
  const { user, isLoading, error, refetch } = useUserSettingsData()

  // 言語リストを取得（キャッシュ付き）
  const { languages, isLoading: langLoading } = useLanguages()

  // 統合データを取得
  const { user: dashUser, languages: dashLangs, isLoading: dashLoading } = useDashboardData()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1>Welcome, {user?.email}</h1>
      <button onClick={() => refetch()}>
        設定を再読み込み
      </button>
    </div>
  )
}
```

### 3. 一回限りのAPI呼び出し

```typescript
import { getSpeakPhraseCount, deletePhrase } from "@/hooks/api";

async function handleCheckPhraseCount(languageCode: string) {
	try {
		// Speakフレーズ数を取得（型安全）
		const result = await getSpeakPhraseCount(languageCode, {
			excludeIfSpeakCountGTE: 50,
			excludeTodayPracticed: true,
		});

		if (result.success) {
			console.log("利用可能フレーズ数:", result.count);
		}
	} catch (error) {
		// エラーは自動でトースト表示される
		console.error("API呼び出しエラー:", error);
	}
}
```

## 利点

### 1. コードの簡潔化

**Before:**

```typescript
// 毎回認証トークンを取得する必要があった
const {
	data: { session },
} = await supabase.auth.getSession();
if (!session) {
	toast.error("認証情報が見つかりません");
	return;
}

const response = await fetch("/api/phrase/speak", {
	headers: {
		Authorization: `Bearer ${session.access_token}`,
	},
});
const data = await response.json();
```

**After:**

```typescript
// 認証は自動で処理される
const data = await api.get("/api/phrase/speak");
```

### 3. 自動エラーハンドリング

- 認証エラーの自動検出
- ネットワークエラーの処理
- 自動的なトースト通知
- タイムアウト制御

### 4. キャッシュによるUX向上

- **自動キャッシュ**: 一度取得したデータは自動でキャッシュ
- **バックグラウンド更新**: ユーザーに気づかれずにデータを最新化
- **楽観的更新**: UIを即座に更新し、後でサーバーと同期
- **重複リクエストの排除**: 同じデータを複数回リクエストしない

## 設定オプション

### APIクライアントのオプション

```typescript
// 認証を使用しない場合
const data = await api.get("/api/public-data", {
	useAuth: false,
});

// エラートーストを無効化
const data = await api.post("/api/data", body, {
	showErrorToast: false,
});

// タイムアウトを設定
const data = await api.get("/api/slow-endpoint", {
	timeout: 60000, // 60秒
});
```

### キャッシュ設定

データフェッチングフックは内部でキャッシュメカニズムを使用しており、パフォーマンスを最適化しています。

## 移行ガイド

既存のコードを新しいAPIクライアントに移行する場合：

1. `supabase.auth.getSession()` と `fetch` の組み合わせを `api.get()` などに置換
2. データの状態管理が必要な場合は、APIフックを使用
3. 一回限りのAPI呼び出しは、useApiのヘルパー関数を使用

これにより、コードの保守性が向上し、ユーザーエクスペリエンスも改善されます。
