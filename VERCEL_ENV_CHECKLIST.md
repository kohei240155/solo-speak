# Vercel 本番環境変数設定チェックリスト

## 現在の本番環境設定値 (.env.production より)

### Supabase設定（新しいAPI Keys方式）
```
NEXT_PUBLIC_SUPABASE_URL=https://wswukmshauusgvklfwzv.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[設定済み - Vercelダッシュボードで確認]
SUPABASE_SECRET_KEY=[設定済み - Vercelダッシュボードで確認]
```

### データベース設定
```
DATABASE_URL=[設定済み - Vercelダッシュボードで確認]
DIRECT_URL=[設定済み - Vercelダッシュボードで確認]
```

### サイトURL
```
NEXT_PUBLIC_SITE_URL=https://solo-speak.vercel.app
```

## Vercelダッシュボード設定手順

1. https://vercel.com/dashboard にアクセス
2. プロジェクト `solo-speak` を選択
3. Settings > Environment Variables
4. 上記の値をすべて "Production" 環境に設定
5. 特に NEXT_PUBLIC_SITE_URL を正しいドメインに設定

## 重要な確認事項

- [ ] NEXT_PUBLIC_SITE_URL が https://solo-speak.vercel.app になっているか
- [ ] 本番用Supabase（wswukmshauusgvklfwzv）の設定になっているか
- [ ] 環境が "Production" に設定されているか
