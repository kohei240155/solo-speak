# トラブルシューティング

## インストール・セットアップ

### npm install でエラーが発生する

**症状**: 依存関係の競合エラー

**解決策**:
```bash
npm install --legacy-peer-deps
```

`--legacy-peer-deps` フラグは必須です。

### Prismaクライアントが見つからない

**症状**: `Cannot find module '@/generated/prisma'`

**解決策**:
```bash
npm run generate
```

または：
```bash
rm -rf node_modules
npm install --legacy-peer-deps
```

### 環境変数が読み込まれない

**症状**: `undefined` または接続エラー

**解決策**:
1. `.env.local` ファイルが存在するか確認
2. ファイル名が正しいか確認（`.env` ではなく `.env.local`）
3. 開発サーバーを再起動

```bash
# 開発サーバーを再起動
npm run dev:local
```

## データベース

### データベース接続エラー

**症状**: `Error: connect ECONNREFUSED`

**解決策**:
1. PostgreSQLが起動しているか確認
   ```bash
   # Mac
   brew services list | grep postgresql

   # 起動
   brew services start postgresql@15
   ```
2. `DATABASE_URL` が正しいか確認
3. データベースが存在するか確認
   ```bash
   psql -l
   ```

### マイグレーションエラー

**症状**: `Migration failed`

**解決策**:
```bash
# Prisma Studioでデータを確認
npm run db:studio:local

# 必要に応じてリセット（データが削除されます）
npx prisma migrate reset
```

### シードエラー

**症状**: `Seed failed`

**解決策**:
1. 既存データとの競合を確認
2. マイグレーションが完了しているか確認
   ```bash
   npm run db:migrate:local
   npm run db:seed:local
   ```

## 認証

### ログインできない

**症状**: Google認証後にリダイレクトされない

**解決策**:
1. Supabase Dashboard > Authentication > URL Configuration を確認
2. **Site URL** がローカル開発環境のURLと一致しているか確認
3. **Redirect URLs** にローカルURLが含まれているか確認

### JWTトークンエラー

**症状**: `401 Unauthorized`

**解決策**:
1. ブラウザのCookieをクリア
2. 再ログイン
3. Supabase Anon Keyが正しいか確認

## API

### APIレスポンスが遅い

**症状**: タイムアウトまたは長時間の待機

**解決策**:
1. OpenAI APIのレート制限を確認
2. データベースクエリの最適化（インデックス確認）
3. ネットワーク接続を確認

### フレーズ生成が失敗する

**症状**: AI翻訳が返ってこない

**解決策**:
1. `OPENAI_API_KEY` が有効か確認
2. OpenAIのクォータを確認
3. エラーログを確認
   ```bash
   # 開発サーバーのコンソールを確認
   ```

### TTS（音声合成）が動作しない

**症状**: 音声が再生されない

**解決策**:
1. Google Cloud環境変数を確認
   - `GOOGLE_CLOUD_PROJECT_ID`
   - `GOOGLE_CLOUD_PRIVATE_KEY`
   - `GOOGLE_CLOUD_CLIENT_EMAIL`
2. Text-to-Speech APIが有効か確認
3. サービスアカウントの権限を確認

### Safariで音声が再生されない

**症状**: Safariブラウザで音声再生されない

**解決策**:
FFmpegによる音声変換が必要です。ローカル開発では：
```bash
# Mac
brew install ffmpeg
```

## 決済（Stripe）

### チェックアウトが失敗する

**症状**: Stripeセッションが作成されない

**解決策**:
1. `STRIPE_SECRET_KEY` が正しいか確認
2. Stripeダッシュボードでエラーを確認
3. テストモードと本番モードのキーが混在していないか確認

### Webhookが受信されない

**症状**: サブスクリプション状態が更新されない

**解決策**:
1. Stripe Dashboard > Webhooks でエンドポイントを確認
2. `STRIPE_WEBHOOK_SECRET` が正しいか確認
3. ローカル開発では Stripe CLI を使用
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

## ビルド

### ビルドエラー

**症状**: `npm run build` が失敗

**解決策**:
1. TypeScriptエラーを確認
   ```bash
   npm run lint
   ```
2. 環境変数が設定されているか確認
3. Prismaクライアントが生成されているか確認
   ```bash
   npm run generate
   ```

### メモリ不足

**症状**: `JavaScript heap out of memory`

**解決策**:
```bash
# Node.jsのメモリ上限を増やす
export NODE_OPTIONS="--max_old_space_size=4096"
npm run build
```

## 本番環境

### Vercelデプロイ失敗

**症状**: デプロイがタイムアウトまたはエラー

**解決策**:
1. ローカルでビルドが成功するか確認
2. Vercelの環境変数を確認
3. Vercelのビルドログを確認

### 本番環境でAPIエラー

**症状**: 開発環境では動作するが本番で失敗

**解決策**:
1. 本番環境の環境変数を確認
2. データベース接続を確認
3. Vercelのファンクションログを確認

## デバッグ方法

### ブラウザ開発者ツール

1. F12 または Cmd+Option+I で開発者ツールを開く
2. **Network** タブでAPIリクエストを確認
3. **Console** タブでエラーを確認

### サーバーログ

開発サーバーのコンソール出力を確認：
```bash
npm run dev:local
# コンソールにログが出力される
```

### Prisma Studio

データベースの内容を確認：
```bash
npm run db:studio:local
# http://localhost:5555 で確認
```

### React Query DevTools

開発環境でReact Queryの状態を確認できます。

## よくある質問

### Q: 開発サーバーが起動しない

A: 以下を順に確認してください：
1. `node_modules` が存在するか
2. `.env.local` が存在するか
3. ポート3000が使用中でないか

### Q: 変更が反映されない

A: 以下を試してください：
1. ブラウザのキャッシュをクリア
2. 開発サーバーを再起動
3. `.next` フォルダを削除して再ビルド
   ```bash
   rm -rf .next
   npm run dev:local
   ```

### Q: 型エラーが発生する

A: Prismaクライアントを再生成してください：
```bash
npm run generate
```
