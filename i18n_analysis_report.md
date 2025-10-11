# i18n 翻訳キー使用状況分析レポート

## 📊 概要

- **日本語キー数**: 143個
- **英語キー数**: 143個
- **使用中のキー**: 136個
- **未使用のキー**: 13個

## ❌ 言語間のキー不一致

### 日本語版のみに存在するキー (6個)

```
speak.modal.options.under50
speak.modal.options.under60
speak.modal.options.under70
speak.modal.options.under80
speak.modal.options.under90
speak.modal.targetPhrases
```

### 英語版のみに存在するキー (6個)

```
speak.modal.excludeHighPracticeCount
speak.modal.options.exclude50
speak.modal.options.exclude60
speak.modal.options.exclude70
speak.modal.options.exclude80
speak.modal.options.exclude90
```

## 🔍 使用状況の詳細分析

### 実際に使用されているキー

`speak.modal.targetPhrases` は `src/components/modals/SpeakModeModal.tsx` で使用されている

`speak.modal.options.under50` - `under90` は `src/components/modals/SpeakModeModal.tsx` で使用されている

### 完全に未使用のキー (13個)

#### 1. 認証関連 (3個)

```
auth.serviceUnavailable
auth.sessionExpired
auth.sessionInvalid
```

**理由**: エラーハンドリング用のメッセージで、実装されていない可能性

#### 2. ホーム画面モバイル版CTA (1個)

```
home.hero.cta.mobile
```

**理由**: モバイル表示時の特別なCTAボタンが実装されていない可能性

#### 3. Speakモーダル関連 (9個)

```
speak.modal.excludeHighPracticeCount
speak.modal.options.exclude50
speak.modal.options.exclude60
speak.modal.options.exclude70
speak.modal.options.exclude80
speak.modal.options.exclude90
speak.modal.options.newest
speak.modal.options.oldest
speak.modal.startFrom
```

**理由**: 英語版で定義されているが、実際のコードでは日本語版のキー（under50-90、targetPhrases）を使用している

## 🛠️ 推奨される修正アクション

### 1. 高優先度：キーの統一

- 英語版の `excludeHighPracticeCount` を削除し、日本語版の `targetPhrases` を追加
- 英語版の `exclude50-90` を `under50-90` に変更
- `speak.modal.startFrom`, `newest`, `oldest` の使用状況を確認し、未使用なら削除

### 2. 中優先度：未使用キーの整理

- `home.hero.cta.mobile` の使用予定を確認し、不要なら削除
- 認証エラーメッセージ（`auth.*`）の実装を検討、または削除

### 3. 低優先度：実装されていない機能

- 認証エラーハンドリングの実装
- モバイル専用CTAボタンの実装（必要な場合）

## 📋 次のステップ

1. 開発チームに確認：未使用キーの削除可否
2. SpeakModeModal.tsx の実装を確認し、日英のキー統一
3. 認証エラーハンドリングの必要性を検討
