# Next.js 開発環境でのキャッシュ問題の解決方法

## 推奨される解決方法（ブラウザ設定）

### Chrome/Edge の場合：
1. 開発者ツールを開く（F12）
2. "Network" タブに移動
3. "Disable cache" にチェックを入れる
4. 開発者ツールを開いている間は自動的にキャッシュが無効化される

### Firefox の場合：
1. 開発者ツールを開く（F12）
2. 設定アイコン（歯車）をクリック
3. "Disable HTTP Cache (when toolbox is open)" にチェック

## 代替方法

### 1. ハードリフレッシュ
- Windows: `Ctrl + Shift + R` または `Ctrl + F5`
- Mac: `Cmd + Shift + R`

### 2. キャッシュクリア
- Chrome: `Ctrl + Shift + Delete` でキャッシュをクリア

## 開発用の簡単なスクリプト（必要に応じて）
```bash
# キャッシュクリア用（手動実行）
npm run clean-start
```

この方法が最も安全で、Next.js の標準的な動作を妨げません。
