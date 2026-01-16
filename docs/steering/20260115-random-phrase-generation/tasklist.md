# ランダムフレーズ生成 - タスクリスト（フルスタック）

**ステータス**: 計画中
**作成日**: 2026-01-15
**設計**: [design.md](./design.md)
**機能タイプ**: C. フルスタック（DBスキーマ変更なし）

---

## タスク

| # | タスク | 対象ファイル | ステータス |
|---|--------|-------------|-----------|
| 1 | API型定義・Zodスキーマ作成 | `src/types/phrase.ts` | [ ] |
| 2 | ランダム生成用プロンプト作成 | `src/prompts/randomPhraseGeneration.ts` | [ ] |
| **3** | **🔴 APIルートテスト作成** | `src/app/api/phrase/random-generate/route.test.ts` | [ ] |
| **4** | **🟢 APIルート実装** | `src/app/api/phrase/random-generate/route.ts` | [ ] |
| **5** | **🔵 APIルートリファクタリング** | - | [ ] |
| **6** | **🟢 カスタムフック拡張** | `src/hooks/phrase/usePhraseManager.ts` | [ ] |
| **7** | **🔴 UIコンポーネントテスト作成** | `src/components/phrase/RandomGeneratedVariations.test.tsx` | [ ] |
| **8** | **🟢 RandomGeneratedVariations実装** | `src/components/phrase/RandomGeneratedVariations.tsx` | [ ] |
| **9** | **🟢 PhraseAdd修正（トグル追加）** | `src/components/phrase/PhraseAdd.tsx` | [ ] |
| **10** | **🔵 UIリファクタリング** | - | [ ] |
| 11 | 統合・動作確認 | - | [ ] |

**TDDサイクルの凡例**:
- 🔴 Red: テスト作成（失敗するテスト）
- 🟢 Green: 最小実装（テストをパス）
- 🔵 Refactor: コード改善（テスト維持）

---

## 詳細タスク説明

### タスク1: API型定義・Zodスキーマ作成
- `RandomPhraseVariation` 型を追加
- `RandomGeneratePhraseRequest` Zodスキーマを追加
- `RandomGeneratePhraseResponse` 型を追加

### タスク2: ランダム生成用プロンプト作成
- `getRandomPhraseGenerationPrompt` 関数を作成
- 1〜500位の順位に基づくフレーズ生成プロンプト
- 日本語訳と表現の解説を含む出力形式

### タスク3-5: APIルート（TDDサイクル）
- POST `/api/phrase/random-generate`
- 認証、回数制限チェック
- ランダム順位生成 → AI呼び出し → レスポンス

### タスク6: カスタムフック拡張
- `isRandomMode` state追加
- `randomGeneratedVariations` state追加
- `selectedRandomVariations` state追加
- `handleRandomGenerate` handler追加
- `handleToggleRandomSelection` handler追加
- `handleSaveSelectedRandomPhrases` handler追加

### タスク7-10: UIコンポーネント（TDDサイクル）
- `RandomGeneratedVariations.tsx` 新規作成
  - チェックボックス付きフレーズカード
  - 日本語訳・説明表示
  - Save Selectedボタン
- `PhraseAdd.tsx` 修正
  - Random Modeトグル追加
  - 条件分岐（Phrase入力欄の表示/非表示）
  - ボタンラベル切り替え

### タスク11: 統合・動作確認
- 通常モード → ランダムモード切り替え確認
- フレーズ生成 → 選択 → 保存フロー確認
- 回数制限の共有動作確認

---

## 参考ファイル

- 既存API: `src/app/api/phrase/generate/route.ts`
- 既存プロンプト: `src/prompts/phraseGeneration.ts`
- 既存UI: `src/components/phrase/PhraseAdd.tsx`, `GeneratedVariations.tsx`
- 既存フック: `src/hooks/phrase/usePhraseManager.ts`
- 型定義: `src/types/phrase.ts`
