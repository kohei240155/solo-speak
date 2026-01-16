# ランダムフレーズ生成 - 技術設計

**ステータス**: 設計中
**作成日**: 2026-01-15
**最終更新日**: 2026-01-15
**要件**: [requirements.md](./requirements.md)

---

## 1. アーキテクチャ概要

### システムフロー

1. ユーザーがRandom Modeトグルをオンにする
2. 「Phrase」入力欄が非表示になり、「Random Generate」ボタンが表示される
3. ユーザーが「Random Generate」ボタンをクリック
4. システムが97個の構文パターンからランダムに1つを選択
5. シチュエーション指定があればそれを使用、なければ10個のトピックからランダムに選択
6. AIが構文パターン×トピックに基づいて自然なフレーズを生成
7. フレーズ（本文、翻訳、構文解説）が表示される
8. ユーザーが「Save」ボタンでフレーズを保存

### 主要コンポーネント

| コンポーネント | パス | 責務 |
|---------------|------|------|
| PhraseAdd | `@/components/phrase/PhraseAdd.tsx` | Random Modeトグル追加、条件分岐 |
| RandomGeneratedVariations | `@/components/phrase/RandomGeneratedVariations.tsx` | ランダム生成結果表示（新規） |
| random-generate API | `@/app/api/phrase/random-generate/route.ts` | ランダムフレーズ生成API（新規） |
| randomPhraseGeneration | `@/prompts/randomPhraseGeneration.ts` | ランダム生成用プロンプト（新規） |
| usePhraseManager | `@/hooks/phrase/usePhraseManager.ts` | ランダム生成ロジック追加 |

---

## 2. データ設計

### 新規/変更テーブル

なし（既存テーブルのみ使用）

### 既存テーブルへの影響

- [x] 影響なし
- 回数制限は既存の `User.remainingPhraseGenerations` を共有使用

---

## 3. API設計

### エンドポイント一覧

| メソッド | パス | 説明 | 認証 |
|----------|------|------|------|
| POST | `/api/phrase/random-generate` | ランダムフレーズ生成 | 必須 |

### リクエスト/レスポンス型

```typescript
// POST /api/phrase/random-generate - リクエスト
const RandomGeneratePhraseSchema = z.object({
  nativeLanguage: z.string().min(1),
  learningLanguage: z.string().min(1),
  selectedContext: z.string().nullable().optional(),
});
type RandomGeneratePhraseRequest = z.infer<typeof RandomGeneratePhraseSchema>;

// レスポンス
interface RandomPhraseVariation {
  original: string;        // フレーズ本文（学習中の言語）
  translation: string;     // 日本語訳
  explanation: string;     // 説明（構文パターンの解説含む）
}

interface RandomGeneratePhraseResponse {
  variations: RandomPhraseVariation[];
}
```

### エラーハンドリング

| エラーコード | HTTPステータス | 説明 |
|-------------|----------------|------|
| DAILY_LIMIT_EXCEEDED | 403 | 1日の生成回数上限（5回）に達した |
| VALIDATION_ERROR | 400 | 入力が無効 |
| UNAUTHORIZED | 401 | 認証エラー |
| GENERATION_FAILED | 500 | AI生成に失敗 |

---

## 4. UI設計

### 画面構成

**フレーズ追加画面（Add Phrase）の変更**:
- Random Modeトグル追加（Situationセクションの上）
- Random Mode時は「Phrase」入力欄を非表示
- 「AI Suggest」ボタンを「Random Generate」ボタンに切り替え

### コンポーネント構成

```
PhraseAdd（修正）
├── Random Modeトグル（新規追加）
├── Situation セクション（既存）
├── Phrase入力欄（Random Mode時は非表示）
├── AI Suggest / Random Generate ボタン（条件分岐）
├── GeneratedVariations（通常モード時）
└── RandomGeneratedVariations（Random Mode時、新規）
    ├── フレーズカード
    │   ├── フレーズ本文
    │   ├── 翻訳
    │   └── 構文解説
    └── Save ボタン
```

### 状態管理

**usePhraseManager への追加**:
```typescript
// 新規state
const [isRandomMode, setIsRandomMode] = useState(false);
const [randomGeneratedVariations, setRandomGeneratedVariations] = useState<RandomPhraseVariation[]>([]);
const [isRandomSaving, setIsRandomSaving] = useState(false);

// 新規handler
const handleRandomGenerate = async () => { ... };
const handleSaveRandomPhrase = async () => { ... };
```

---

## 5. セキュリティとパフォーマンス

### セキュリティ考慮事項

- [x] 認証: `authenticateRequest()` 使用
- [x] 認可: ユーザー所有データのみアクセス可能
- [x] 入力検証: Zodスキーマでバリデーション
- [x] 回数制限: 既存の回数制限ロジックを共有（DoS対策）

### パフォーマンス考慮事項

- [x] インデックス設計: 既存インデックスで対応可能
- [x] クエリ最適化: 1回のAPI呼び出しで1フレーズ生成
- [x] キャッシュ: 生成結果はキャッシュしない（毎回異なる結果を期待）

---

## 6. テスト戦略

### テスト方針

**TDDアプローチ**: 厳格（Red-Green-Refactor）
**カバレッジ目標**: 80%

### テスト対象一覧

| 対象 | ファイルパス | テストファイル | 優先度 |
|------|-------------|---------------|--------|
| APIルート | `src/app/api/phrase/random-generate/route.ts` | `route.test.ts` | 必須 |
| プロンプト | `src/prompts/randomPhraseGeneration.ts` | `randomPhraseGeneration.test.ts` | 推奨 |
| コンポーネント | `src/components/phrase/RandomGeneratedVariations.tsx` | `RandomGeneratedVariations.test.tsx` | 推奨 |

### テストケース詳細

#### APIルート: `POST /api/phrase/random-generate`

**正常系**:
- [ ] 有効なリクエストで200を返す
- [ ] 1つのフレーズが生成される
- [ ] フレーズに original, translation, explanation が含まれる
- [ ] remainingPhraseGenerations が1減少する

**異常系**:
- [ ] 認証なしで401を返す
- [ ] 残り回数0で403を返す
- [ ] 無効なリクエストボディで400を返す

#### コンポーネント: `RandomGeneratedVariations`

**レンダリング**:
- [ ] フレーズカードが表示される
- [ ] 翻訳と構文解説が表示される

**ユーザー操作**:
- [ ] Saveボタンでフレーズが保存される
- [ ] 保存中はボタンが無効化される

### モック戦略

| 依存 | モック方法 | 備考 |
|------|-----------|------|
| Prisma | `jest.mock('@/utils/prisma')` | `__mocks__/prisma.ts` 使用 |
| Supabase Auth | `jest.mock('@/utils/supabase-server')` | `__mocks__/supabase.ts` 使用 |
| OpenAI API | `jest.fn()` | fetchをモック |

---

## 7. 影響範囲

### 直接影響を受けるファイル

| ファイル | 変更内容 | 影響レベル |
|----------|----------|-----------|
| `src/components/phrase/PhraseAdd.tsx` | Random Modeトグル追加、条件分岐 | High |
| `src/hooks/phrase/usePhraseManager.ts` | ランダム生成ロジック追加 | High |
| `src/types/phrase.ts` | RandomPhraseVariation型追加 | Medium |

### 新規作成ファイル

| ファイル | 内容 |
|----------|------|
| `src/app/api/phrase/random-generate/route.ts` | ランダム生成APIエンドポイント |
| `src/prompts/randomPhraseGeneration.ts` | ランダム生成用AIプロンプト |
| `src/components/phrase/RandomGeneratedVariations.tsx` | ランダム生成結果表示コンポーネント |

### 間接的に影響を受ける可能性のあるファイル

- `src/app/api/phrase/remaining/route.ts` - 回数制限を共有するため動作確認が必要

---

## 8. リスクと代替案

### リスク

| リスク | 影響度 | 軽減策 |
|--------|--------|--------|
| 構文パターンとトピックの組み合わせが不自然になる | 低 | プロンプトで自然さ優先を指示 |
| 生成時間が長くユーザー体験に影響 | 低 | ローディング表示で対応（既存と同様） |

### 検討した代替案

#### 代替案A: 既存APIを拡張する

- **説明**: `/api/phrase/generate` にモードパラメータを追加
- **メリット**: コード重複が少ない
- **デメリット**: 既存機能への影響リスク、テストが複雑化
- **却下理由**: 責務の分離を優先し、新規エンドポイントを作成

---

## 9. 未解決の質問

- [x] 順位の表示: 生成されたフレーズにランク（順位）を表示するか → 不要（構文パターンベースに変更）

---

## 参考資料

- 既存のフレーズ生成API: `src/app/api/phrase/generate/route.ts`
- 既存のプロンプト: `src/prompts/phraseGeneration.ts`
- 既存のUI: `src/components/phrase/PhraseAdd.tsx`, `GeneratedVariations.tsx`
