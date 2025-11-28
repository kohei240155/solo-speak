# Supabase Storage セットアップガイド

## 概要

このドキュメントは、Solo Speakのスピーチ音声ファイルを保存するためのSupabase Storageの設定手順を説明します。

## バケット設定

### バケット名

`speeches`

### バケット設定値

- **Name**: `speeches`
- **Public bucket**: ❌ オフ（プライベート）
- **File size limit**: `10485760` (10MB)
- **Allowed MIME types**: `audio/wav, audio/mpeg, audio/webm, audio/ogg`

---

## セットアップ手順

### 1. Supabaseダッシュボードにログイン

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択

### 2. Storageバケットの作成

1. 左サイドバーから **Storage** をクリック
2. **New bucket** ボタンをクリック
3. 以下の設定を入力：
   - **Name**: `speeches`
   - **Public bucket**: オフ（チェックを外す）
   - **File size limit**: `10MB`
   - **Allowed MIME types**: `audio/wav, audio/mpeg, audio/webm, audio/ogg`
4. **Create bucket** をクリック

### 3. RLS (Row Level Security) ポリシーの設定

バケット作成後、**Policies** タブを開き、以下の3つのポリシーを作成します。

---

#### ポリシー1: アップロード権限 (INSERT)

**ポリシー名**: `Users can upload their own speech audio`

**操作**: `INSERT`

**対象ロール**: `authenticated`

**WITH CHECK式**:

```sql
bucket_id = 'speeches'
AND (storage.foldername(name))[1] = auth.uid()::text
```

**SQL全文**:

```sql
CREATE POLICY "Users can upload their own speech audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'speeches'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

#### ポリシー2: 読み取り権限 (SELECT)

**ポリシー名**: `Users can read their own speech audio`

**操作**: `SELECT`

**対象ロール**: `authenticated`

**USING式**:

```sql
bucket_id = 'speeches'
AND (storage.foldername(name))[1] = auth.uid()::text
```

**SQL全文**:

```sql
CREATE POLICY "Users can read their own speech audio"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'speeches'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

#### ポリシー3: 削除権限 (DELETE)

**ポリシー名**: `Users can delete their own speech audio`

**操作**: `DELETE`

**対象ロール**: `authenticated`

**USING式**:

```sql
bucket_id = 'speeches'
AND (storage.foldername(name))[1] = auth.uid()::text
```

**SQL全文**:

```sql
CREATE POLICY "Users can delete their own speech audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'speeches'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## ファイルパス構造

音声ファイルは以下のパス構造で保存されます：

```
speeches/
  └── {userId}/
      └── {speechId}/
          └── audio.wav
```

**例**:

```
speeches/a1b2c3d4-e5f6-7890-abcd-ef1234567890/s9z8y7x6-w5v4-u3t2-s1r0-q9p8o7n6m5l4/audio.wav
```

---

## クライアント側実装例

### アップロード

```typescript
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const uploadSpeechAudio = async (
	userId: string,
	speechId: string,
	audioBlob: Blob,
) => {
	const supabase = createClientComponentClient();
	const filePath = `${userId}/${speechId}/audio.wav`;

	const { data, error } = await supabase.storage
		.from("speeches")
		.upload(filePath, audioBlob, {
			contentType: "audio/wav",
			upsert: true, // 既存ファイルを上書き
		});

	if (error) throw error;
	return data.path;
};
```

### 署名付きURL取得

```typescript
const getSpeechAudioUrl = async (filePath: string) => {
	const supabase = createClientComponentClient();

	const { data, error } = await supabase.storage
		.from("speeches")
		.createSignedUrl(filePath, 3600); // 1時間有効

	if (error) throw error;
	return data.signedUrl;
};
```

### ファイル削除

```typescript
const deleteSpeechAudio = async (filePath: string) => {
	const supabase = createClientComponentClient();

	const { error } = await supabase.storage.from("speeches").remove([filePath]);

	if (error) throw error;
};
```

---

## セキュリティ

### RLSポリシーの効果

- ユーザーは**自分のフォルダ内のファイルのみ**にアクセス可能
- `(storage.foldername(name))[1]` で最初のフォルダ名（userId）を取得
- `auth.uid()` で現在ログインしているユーザーのIDを取得
- 両者が一致する場合のみ操作を許可

### プライベートバケット

- `Public bucket: オフ` により、URLを知っていても直接アクセス不可
- 署名付きURL（Signed URL）経由でのみアクセス可能
- URLには有効期限を設定可能

---

## トラブルシューティング

### アップロードエラー: "new row violates row-level security policy"

- ポリシーが正しく設定されているか確認
- ファイルパスが `{userId}/{speechId}/audio.wav` の形式か確認
- ユーザーが認証済み（authenticated）か確認

### ファイルが見つからない: "Object not found"

- ファイルパスが正しいか確認
- バケット名が `speeches` か確認
- ユーザーIDが正しいか確認

### 署名付きURL取得エラー

- ファイルが実際に存在するか確認
- ユーザーに読み取り権限があるか確認（自分のファイルか）

---

## 環境別の設定

### 開発環境

- Supabaseの開発プロジェクトでバケット作成
- 上記手順に従ってポリシーを設定

### 本番環境

- Supabaseの本番プロジェクトでバケット作成
- **同じポリシー**を設定（コピー＆ペースト推奨）
- 環境変数 `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` が正しく設定されているか確認

---

## 参考リンク

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase Storage RLS](https://supabase.com/docs/guides/storage/security/access-control)
- [Solo Speak API仕様書](./api/speech-save.md)

---

## チェックリスト

設定完了後、以下を確認してください：

- [ ] バケット `speeches` が作成されている
- [ ] バケットがプライベート設定になっている
- [ ] ファイルサイズ上限が10MBに設定されている
- [ ] 3つのRLSポリシー（INSERT, SELECT, DELETE）が作成されている
- [ ] ポリシーの対象ロールが `authenticated` になっている
- [ ] クライアント側でアップロード・取得のテストが成功する

---

**最終更新日**: 2025年11月28日
