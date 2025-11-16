# User Icon API

## 概要
ユーザーアイコンのアップロードと削除を行うAPIエンドポイント。Supabase Storageを使用して画像を管理します。

## エンドポイント
- `POST /api/user/icon` - アイコンアップロード
- `DELETE /api/user/icon` - アイコン削除

## 認証
必要

---

## POST /api/user/icon

### リクエスト

#### Content-Type
`multipart/form-data`

#### フォームデータ
| フィールド | 型 | 必須 | 説明 |
|----------|-----|------|------|
| icon | File | ✓ | 画像ファイル |

### レスポンス

#### 成功時 (200 OK)
```json
{
  "iconUrl": "https://xxx.supabase.co/storage/v1/object/public/images/user-icons/xxx.jpg",
  "message": "Icon uploaded successfully"
}
```

#### エラー時
```json
{
  "error": "エラーメッセージ"
}
```

**エラーコード:**
- `400` - バリデーションエラー
  - ファイルが不足
  - ファイルタイプが不正
  - ファイルサイズ超過
- `401` - 認証失敗
- `500` - サーバーエラー

### バリデーション

#### 許可されるファイルタイプ
- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/webp`

#### ファイルサイズ制限
最大 **5MB**

### 機能詳細

#### 既存アイコンの処理
1. 既存のアイコンURLを確認
2. Supabase Storage のURLの場合は削除
3. Google URLの場合は削除をスキップ
4. 削除失敗しても新規アップロードは続行

#### アップロード処理
- Supabase Storage にサーバーモードでアップロード
- ユーザーIDを基にファイル名を生成
- 公開URLを返す

#### Google アバターの扱い
以下のURLパターンはSupabase Storageから削除しない：
- `googleusercontent.com`
- `googleapis.com`
- `accounts.google.com`
- `https://lh3.googleusercontent.com`

---

## DELETE /api/user/icon

### リクエスト

#### リクエストボディ
```typescript
interface DeleteIconRequest {
  iconUrl: string; // 削除するアイコンのURL（必須）
}
```

### レスポンス

#### 成功時 (200 OK)
```json
{
  "message": "Icon deleted successfully"
}
```

#### エラー時
```json
{
  "error": "エラーメッセージ"
}
```

**エラーコード:**
- `400` - iconUrl が不足
- `401` - 認証失敗
- `500` - サーバーエラー

### 機能詳細
- Supabase Storage からアイコンファイルを削除
- URLからファイルパスを抽出して削除

## 使用例

### アイコンアップロード
```typescript
async function uploadIcon(file: File) {
  const formData = new FormData();
  formData.append('icon', file);
  
  const response = await fetch('/api/user/icon', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: formData
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

### ファイル選択とアップロード
```typescript
function IconUploader() {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // ファイルサイズチェック
    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください');
      return;
    }
    
    // ファイルタイプチェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('JPEG、PNG、WebP形式の画像のみアップロード可能です');
      return;
    }
    
    const iconUrl = await uploadIcon(file);
    if (iconUrl) {
      // UIを更新
    }
  };
  
  return (
    <input
      type="file"
      accept="image/jpeg,image/jpg,image/png,image/webp"
      onChange={handleFileChange}
    />
  );
}
```

### アイコン削除
```typescript
async function deleteIcon(iconUrl: string) {
  const response = await fetch('/api/user/icon', {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ iconUrl })
  });
  
  if (response.ok) {
    console.log('削除成功');
    return true;
  } else {
    const error = await response.json();
    console.error('削除失敗:', error.error);
    return false;
  }
}
```

### 画像プレビュー付きアップロード
```typescript
function IconUploaderWithPreview() {
  const [preview, setPreview] = useState<string | null>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // プレビュー表示
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // アップロード
    const iconUrl = await uploadIcon(file);
    if (iconUrl) {
      setPreview(iconUrl);
    }
  };
  
  return (
    <div>
      {preview && <img src={preview} alt="プレビュー" width={100} height={100} />}
      <input type="file" accept="image/*" onChange={handleFileChange} />
    </div>
  );
}
```

## セキュリティ
- ユーザーは自分のアイコンのみアップロード・削除可能
- ファイルタイプとサイズを厳密にバリデーション
- Supabase Storage のセキュリティルールで保護

## ストレージ管理
- Supabase Storage の `images` バケットを使用
- パス: `user-icons/{userId}_{timestamp}.{ext}`
- 既存ファイルは自動的に上書き（新規アップロード時）

## 関連ユーティリティ
- `uploadUserIcon` (`@/utils/storage`)
- `deleteUserIcon` (`@/utils/storage`)

## 関連エンドポイント
- `POST /api/user/icon/google` - Google アバターアップロード
- `PUT /api/user/settings` - ユーザー設定更新（iconUrl含む）
