# 本番環境設定ガイド

## 本番環境の問題解決について

`言語データの取得に失敗しました` エラーの解決のため、Supabaseの新しいAPI Keys形式に移行し、GitGuardianのセキュリティ警告も解決しました。

## 環境ファイルの設定

### 1. テンプレートファイルをコピー
```bash
# 本番環境用
cp .env.production.template .env.production

# 開発環境用（必要に応じて）
cp .env.local.template .env.local
```

### 2. 実際の値を設定
作成した `.env.production` ファイルに実際のSupabaseの値を設定してください。

## Vercel ダッシュボードでの設定手順

1. Vercel ダッシュボード (https://vercel.com/dashboard) にアクセス
2. プロジェクト `solo-speak` を選択
3. "Settings" タブをクリック
4. "Environment Variables" セクションを確認

## 必要な環境変数

### データベース接続
```
DATABASE_URL=[実際のデータベース接続URL]
DIRECT_URL=[実際のダイレクト接続URL]
```

### Supabase設定（新しいAPI Keys方式）
```
NEXT_PUBLIC_SUPABASE_URL=https://wswukmshauusgvklfwzv.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[実際のPublishable key]
SUPABASE_SECRET_KEY=[実際のSecret key]
```

### サイトURL
```
NEXT_PUBLIC_SITE_URL=https://solo-speak.vercel.app
```

## 完了した対応

### ✅ セキュリティ問題の解決
- GitGuardianが検出していた機密情報を含むコミット `6e0e21d` を履歴から完全削除
- Git履歴をクリーンアップし、強制プッシュで安全な状態に更新

### ✅ Supabase API Keys移行
- 新しいPUBLISHABLE_KEY/SECRET_KEY形式に対応
- 既存のANON_KEY形式との後方互換性も保持
- サーバーサイド専用クライアント `src/utils/supabase-server.ts` を追加

### ✅ デバッグ機能強化
- 本番環境での詳細なエラーログ機能を追加
- データベース接続の診断ツールを実装
- フォールバック機能で複数の接続方法を試行

## 確認事項

- [x] Git履歴から機密情報を完全削除
- [x] 新しいSupabase API Keys形式に対応
- [x] サーバーサイドクライアントの実装
- [ ] 全ての環境変数が "Production" 環境に設定されているか
- [ ] DATABASE_URL と DIRECT_URL が本番データベースを指しているか
- [ ] Supabase の URL とキーが本番プロジェクトのものか
- [ ] NEXT_PUBLIC_SITE_URL が本番ドメインを指しているか

## セキュリティ注意事項

- ✅ 実際のAPIキーやパスワードは絶対にGitにコミットしない
- ✅ Vercelの環境変数でのみ管理する
- ✅ 開発環境と本番環境のキーを混同しない
- ✅ GitGuardianによるセキュリティスキャンをクリア

## 次のステップ

1. Vercelダッシュボードで新しい環境変数を設定
2. 本番環境での動作確認
3. 言語データ取得機能のテスト