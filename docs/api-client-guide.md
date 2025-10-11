# API クライアントとSWRの使用ガイド

## 概要

このプロジェクトでは、API呼び出しを簡潔にし、データの状態管理を効率化するために以下のツールを導入しました：

1. **汎用APIクライアント** (`src/utils/api.ts`) - 認証とエラーハンドリングを含む統一されたAPI呼び出し
2. **SWRフック** (`src/hooks/useSWRApi.ts`) - データキャッシュと状態管理
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

### 2. SWRを使ったデータ取得とキャッシュ

```typescript
import { useUserSettings, useLanguages, useDashboardData } from '@/hooks/useSWRApi'

function MyComponent() {
  // ユーザー設定を取得（キャッシュ付き）
  const { user, isLoading, error, refetch } = useUserSettings()

  // 言語リストを取得（長期キャッシュ）
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
import {
  getSpeakPhrase,
  updatePhraseCount,
  deletePhrase,
} from "@/hooks/useApi";

async function handleSpeakStart() {
  try {
    // Speakフレーズを取得
    const data = await getSpeakPhrase({
      language: "en",
      order: "new_to_old",
      prioritizeLowPractice: "true",
    });

    if (data.success && data.phrase) {
      console.log("フレーズ取得成功:", data.phrase);
    }
  } catch (error) {
    // エラーは自動でトースト表示される
    console.error("API呼び出しエラー:", error);
  }
}

async function handlePhraseComplete(phraseId: string) {
  // 練習カウントを更新
  await updatePhraseCount(phraseId);
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

### 2. 自動エラーハンドリング

- 認証エラーの自動検出
- ネットワークエラーの処理
- 自動的なトースト通知
- タイムアウト制御

### 3. SWRによるUX向上

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

### SWRのキャッシュ設定

```typescript
// カスタムキャッシュ設定
const { data } = useSWR("/api/data", fetcher, {
  // 5分間キャッシュ
  dedupingInterval: 5 * 60 * 1000,
  // フォーカス時の再検証を無効化
  revalidateOnFocus: false,
  // 10秒間隔で自動更新
  refreshInterval: 10000,
});
```

## 移行ガイド

既存のコードを新しいAPIクライアントに移行する場合：

1. `supabase.auth.getSession()` と `fetch` の組み合わせを `api.get()` などに置換
2. データの状態管理が必要な場合は、SWRフックを使用
3. 一回限りのAPI呼び出しは、useApiのヘルパー関数を使用

これにより、コードの保守性が向上し、ユーザーエクスペリエンスも改善されます。
