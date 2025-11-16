# User Icon Google API

## 概要
GoogleアバターURLからSupabase Storageに画像をダウンロード・アップロードするAPIエンドポイント。

## エンドポイント
`POST /api/user/icon/google`

## 認証
必要

## リクエスト

### リクエストボディ
```typescript
interface GoogleAvatarUploadRequest {
  googleAvatarUrl: string; // GoogleアバターのURL（必須）
}
```

## レスポンス

### 成功時 (200 OK)
```json
{
  "iconUrl": "https://xxx.supabase.co/storage/v1/object/public/images/user-icons/xxx.jpg",
  "message": "Google avatar uploaded successfully"
}
```

### エラー時
```json
{
  "error": "エラーメッセージ"
}
```

**エラーコード:**
- `400` - バリデーションエラー
  - googleAvatarUrl が不足
  - 無効なJSON
  - 不正なGoogle URL
- `401` - 認証失敗
- `500` - サーバーエラー

## 機能詳細

### GoogleアバターURL検証
以下のドメインを含むURLのみ許可：
- `googleusercontent.com`
- `googleapis.com`
- `google.com`

### 処理フロー
1. Google URLから画像をダウンロード
2. Supabase Storage にアップロード
3. 公開URLを返す

### セキュリティ
- APIルートで実行されるため、サーバー側の認証情報を使用
- クライアント側のセッション情報は不要
- ユーザー認証は必須

## 使用例

### 基本的な使用
```typescript
async function uploadGoogleAvatar(googleAvatarUrl: string) {
  const response = await fetch('/api/user/icon/google', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ googleAvatarUrl })
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log('アップロード成功:', data.iconUrl);
    return data.iconUrl;
  } else {
    const error = await response.json();
    console.error('アップロード失敗:', error.error);
    return null;
  }
}
```

### Googleログイン後の使用
```typescript
async function handleGoogleLogin(user: GoogleUser) {
  // Googleのプロフィール画像URLを取得
  const googlePhotoUrl = user.picture;
  
  if (googlePhotoUrl) {
    // Supabase Storageにアップロード
    const supabaseIconUrl = await uploadGoogleAvatar(googlePhotoUrl);
    
    if (supabaseIconUrl) {
      // ユーザー設定を更新
      await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          iconUrl: supabaseIconUrl
        })
      });
    }
  }
}
```

### エラーハンドリング付き
```typescript
async function uploadGoogleAvatarWithErrorHandling(googleAvatarUrl: string) {
  // URL検証
  const isGoogleUrl = 
    googleAvatarUrl.includes('googleusercontent.com') ||
    googleAvatarUrl.includes('googleapis.com') ||
    googleAvatarUrl.includes('google.com');
  
  if (!isGoogleUrl) {
    console.error('Google URLではありません');
    return null;
  }
  
  try {
    const response = await fetch('/api/user/icon/google', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ googleAvatarUrl })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    const data = await response.json();
    return data.iconUrl;
  } catch (error) {
    console.error('アップロードエラー:', error);
    return null;
  }
}
```

### React コンポーネントでの使用
```typescript
function GoogleAvatarImporter({ googlePhotoUrl }: { googlePhotoUrl: string }) {
  const [loading, setLoading] = useState(false);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  
  const handleImport = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/user/icon/google', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ googleAvatarUrl: googlePhotoUrl })
      });
      
      if (response.ok) {
        const data = await response.json();
        setIconUrl(data.iconUrl);
        // ユーザー設定を更新するなどの処理
      }
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button onClick={handleImport} disabled={loading}>
      {loading ? 'インポート中...' : 'Googleアバターをインポート'}
    </button>
  );
}
```

## `/api/user/icon` との違い

| 機能 | `/api/user/icon` | `/api/user/icon/google` |
|------|-----------------|------------------------|
| 入力 | ファイル（multipart/form-data） | URL（JSON） |
| ソース | ローカルファイル | Google サーバー |
| 用途 | 手動アップロード | Google認証後の自動設定 |
| バリデーション | ファイルタイプ・サイズ | URL形式 |

## 使用シーン
- Google認証後にアバターを自動設定
- GoogleアカウントのプロフィールをSolo Speakに反映
- ユーザーがGoogleアバターを明示的にインポートする場合

## メリット
- ユーザーがファイルを選択する必要がない
- GoogleのCDNから高速ダウンロード
- アカウント作成時のUX向上

## 注意事項
- GoogleアバターURLは変更される可能性がある
- ダウンロード失敗時のフォールバック処理を実装推奨
- 画像サイズによってはアップロード時間がかかる

## 関連ユーティリティ
- `downloadAndUploadGoogleAvatar` (`@/utils/storage`)
- `createServerSupabaseClient` (`@/utils/supabase-server`)

## 関連エンドポイント
- `POST /api/user/icon` - ローカルファイルアップロード
- `PUT /api/user/settings` - ユーザー設定更新
