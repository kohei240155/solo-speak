# ビルド結果レポート

## 実行コマンド
`npm run build:local`

## 結果
✅ 成功

## 詳細

### ビルドサマリー

- **Next.js バージョン**: 15.3.6
- **環境変数**: `.env.local`, `.env.production`, `.env` を使用
- **コンパイル時間**: 17.0秒（キャッシュクリア後）
- **静的ページ生成**: 64ページ
- **初回実行時のエラー**: キャッシュエラー（`.next` ディレクトリクリアで解決）

### ビルド手順

1. 初回ビルドで `MODULE_NOT_FOUND` エラーが発生
   - エラー内容: `Cannot find module '/Users/kohei/dev/solo-speak/.next/server/pages/_document.js'`
   - 原因: Next.jsビルドキャッシュの不整合

2. `.next` ディレクトリを削除して再ビルド実行
   - コマンド: `rm -rf .next && npm run build:local`
   - 結果: 成功

### 生成されたルート

**静的ページ（64ページ）**:
- ランディングページ（`/`）: 9.31 kB
- ダッシュボード（`/dashboard`）: 2.94 kB
- フレーズ機能（Add、List、Practice、Quiz、Speak）
- スピーチ機能（Add、List、Review）
- 設定・ランキング・認証・規約ページ

**動的APIルート（49エンドポイント）**:
- `/api/phrase/*` - フレーズ関連API
- `/api/speech/*` - スピーチ関連API
- `/api/ranking/*` - ランキング関連API
- `/api/user/*` - ユーザー関連API
- `/api/stripe/*` - 決済関連API
- その他（TTS、言語設定、シチュエーションなど）

### ビルドステータス

- ✅ TypeScriptコンパイル成功
- ✅ ESLintチェック成功
- ✅ 型検証成功
- ✅ 静的ページ生成成功
- ✅ ビルドトレース収集成功

### First Load JS

- **共有チャンク**: 101 kB
  - `chunks/1684-507453315bfc28db.js`: 46.1 kB
  - `chunks/4bd1b696-50303841b5698bb8.js`: 53.2 kB
  - その他の共有チャンク: 2.01 kB

- **最大ページサイズ**: `/speech/add` (220 kB First Load JS)
- **最小ページサイズ**: `/icon.png` (0 B)

## 修正提案

### 実施済みの修正

1. **Next.jsキャッシュクリア**
   - `.next` ディレクトリを削除して再ビルド
   - これにより `MODULE_NOT_FOUND` エラーを解決

### 今後の推奨事項

1. **ビルドスクリプトの改善**
   - ビルドエラーが発生した場合に自動的に `.next` をクリアするスクリプトの追加を検討
   - 例: `npm run build:clean` を追加（`rm -rf .next && next build`）

2. **パフォーマンス最適化**
   - `/speech/add` ページ（220 kB）のバンドルサイズ削減を検討
   - 動的インポートやコード分割の活用

3. **定期的なキャッシュクリア**
   - 依存関係更新後やマージ後は `.next` ディレクトリをクリアしてビルドすることを推奨

## 最終結果

✅ **ビルド成功**

Practice機能実装後のビルドが正常に完了しました。すべてのページとAPIルートが正しくビルドされ、TypeScriptおよびESLintのエラーはありません。

---

**レポート作成日時**: 2026-01-18  
**実行環境**: macOS (Darwin 24.6.0)  
**ブランチ**: feature/20260117-practice-mode
