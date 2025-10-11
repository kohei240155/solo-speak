# 未使用i18nキー削除ガイド

## ✅ 完了した修正

### 1. 英語版のキー統一 ✅

- `speak.modal.excludeHighPracticeCount` → `speak.modal.targetPhrases` に変更
- `speak.modal.options.exclude50-90` → `speak.modal.options.under50-90` に変更

### 2. キーの一致確認結果 ✅

- 日本語版と英語版のキーが完全に一致しました

## 🔍 残りの未使用キー（7個）

### 削除推奨（4個）

以下のキーは確実に未使用のため削除できます：

1. **`speak.modal.startFrom`**
   - 日本語: "練習順序"
   - 英語: "Practice Order"
   - 理由: SpeakModeModal.tsxで使用されていない

2. **`speak.modal.options.newest`**
   - 日本語: "新しい順"
   - 英語: "Newest"
   - 理由: SpeakModeModal.tsxで使用されていない

3. **`speak.modal.options.oldest`**
   - 日本語: "古い順"
   - 英語: "Oldest"
   - 理由: SpeakModeModal.tsxで使用されていない

4. **`home.hero.cta.mobile`**
   - 日本語: "Let's Start!"
   - 英語: "Let's Start!"
   - 理由: page.tsxでは`home.hero.cta.desktop`のみ使用

### 保留推奨（3個）

以下のキーは将来的に必要になる可能性があるため保留：

1. **`auth.sessionExpired`** - セッション期限切れエラー
2. **`auth.sessionInvalid`** - セッション無効エラー
3. **`auth.serviceUnavailable`** - 認証サービス利用不可エラー

## 📝 削除手順

### 日本語版ファイル（public/locales/ja/common.json）から削除：

```json
// 以下の行を削除
"startFrom": "練習順序",
"newest": "新しい順",
"oldest": "古い順",
"mobile": "Let's Start!",
```

### 英語版ファイル（public/locales/en/common.json）から削除：

```json
// 以下の行を削除
"startFrom": "Practice Order",
"newest": "Newest",
"oldest": "Oldest",
"mobile": "Let's Start!",
```

## 🎯 期待される結果

- 未使用キー数: 7個 → 3個に削減
- すべてのキーが日英で一致
- 将来必要な認証エラーキーは保持
