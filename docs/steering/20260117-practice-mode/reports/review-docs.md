# ドキュメント整合性レポート

## 確認対象

feature/20260117-practice-mode ブランチで追加されたPractice機能（発話練習機能）に関する以下のドキュメントを確認しました。

### 確認したドキュメント

- `docs/api/README.md` - API仕様一覧
- `docs/frontend/components.md` - コンポーネント一覧
- `docs/frontend/hooks.md` - カスタムフック一覧
- `docs/backend/database.md` - データベーススキーマ
- `docs/shared/types.md` - 型定義
- `docs/architecture.md` - システムアーキテクチャ
- `docs/steering/20260117-practice-mode/design.md` - 技術設計
- `docs/steering/20260117-practice-mode/requirements.md` - 要件定義
- `CLAUDE.md` - プロジェクト概要

## 結果

⚠️ **更新推奨** - Practice APIの個別ドキュメントファイルが不足

## 詳細

### 更新が必要なドキュメント

#### Practice API個別ドキュメント（Critical）

`docs/api/README.md` には以下のエンドポイントが記載されていますが、個別のドキュメントファイルが存在しません。

**不足しているファイル**:
- `docs/api/phrase/get-phrase-practice.md`
- `docs/api/phrase/post-phrase-practice-answer.md`
- `docs/api/phrase/get-phrase-practice-stats.md`
- `docs/api/ranking/get-ranking-practice.md`

**参考**: 他のAPIエンドポイントには個別ドキュメントが存在します（例: `docs/api/phrase/get-phrase-quiz.md`, `docs/api/ranking/get-ranking-quiz.md`）。

---

### 更新推奨のドキュメント

#### docs/frontend/components.md

**追加推奨**:
- `FadeIn` - フェードインアニメーションコンポーネント
- `StarProgress` - 星形進捗表示
- `PracticeHelpModal` - ヘルプモーダル

---

### 整合性が確認されたドキュメント

#### 1. docs/api/README.md ✅

Practice API エンドポイントが正しく記載されています：
- `GET /api/phrase/practice`
- `POST /api/phrase/practice/answer`
- `GET /api/phrase/practice/stats`
- `GET /api/ranking/practice`

#### 2. docs/frontend/components.md ✅

以下のPractice関連コンポーネントが記載されています：
- `PracticePractice` - 練習画面メインコンポーネント
- `PracticeResult` - 結果表示コンポーネント
- `PracticeModeModal` - モード選択モーダル
- `DiffHighlight` - 差分ハイライト表示
- `PhraseTabNavigation` - "practice" タブの記載あり

#### 3. docs/frontend/hooks.md ✅

以下のフックが記載されています：
- `usePracticeSession` - セッション管理
- `usePracticeAnswer` - 回答送信
- `useSpeechRecognition` - 音声認識

#### 4. docs/backend/database.md ✅

Practice関連のデータベーススキーマが記載されています：

**Userテーブルへの追加フィールド**:
- `phraseMode` - フレーズ練習モード
- `practiceIncludeExisting` - 既存フレーズを含めるか
- `practiceStartDate` - Practice開始日

**Phraseテーブルへの追加フィールド**:
- `practiceCorrectCount` - 正解回数
- `practiceIncorrectCount` - 不正解回数
- `lastPracticeDate` - 最終Practice日時

**PracticeLogテーブル**:
- すべてのフィールドとインデックスが記載

#### 5. docs/shared/types.md ✅

Practice関連の型定義が記載されています：
- `PracticeMode` - "normal" | "review"
- `PracticePhrase` - 練習対象フレーズ
- `DiffResult` - 差分情報
- `PracticeConfig` - 練習設定
- `PracticeSessionState` - セッション状態
- `PracticeResultState` - 結果状態
- 定数（`PRACTICE_MASTERY_COUNT`, `PRACTICE_SIMILARITY_THRESHOLD`等）

#### 6. docs/architecture.md ✅

Practice機能が適切に反映されています：
- `src/hooks/practice/` ディレクトリの記載
- `src/components/practice/` ディレクトリの記載

#### 7. docs/steering/20260117-practice-mode/ ✅

設計ドキュメントと要件定義が存在し、実装と整合：
- `design.md` - 技術設計（API仕様、データ設計、UI設計）
- `requirements.md` - 要件定義（ユーザーストーリー、ゴール）

#### 8. CLAUDE.md ✅

- プロジェクト概要、技術スタック、基本コマンド、ワークフローは最新
- ビルド実行ルールが更新済み

---

## 修正提案

### 1. API個別ドキュメントの作成（推奨）

以下の4つのAPIドキュメントを作成することを推奨します：

#### docs/api/phrase/get-phrase-practice.md

```markdown
# GET /api/phrase/practice

練習対象フレーズを取得

## 認証
必須

## Query Parameters
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| languageId | string | Yes | 学習言語ID |
| mode | "normal" \| "review" | Yes | 練習モード |
| questionCount | number | No | 出題数 |

## Response (200 OK)
```json
{
  "success": true,
  "phrases": [...],
  "totalCount": 10
}
```

## 参照
- 実装: `src/app/api/phrase/practice/route.ts`
- 型定義: `src/types/practice.ts`
```

#### docs/api/phrase/post-phrase-practice-answer.md

```markdown
# POST /api/phrase/practice/answer

練習回答を送信し、判定結果を取得

## 認証
必須

## Request Body
```json
{
  "phraseId": "phrase-123",
  "transcript": "Hello world",
  "mode": "normal"
}
```

## Response (200 OK)
```json
{
  "success": true,
  "correct": true,
  "similarity": 0.95,
  "diffResult": [...]
}
```

## 参照
- 実装: `src/app/api/phrase/practice/answer/route.ts`
```

#### docs/api/phrase/get-phrase-practice-stats.md

```markdown
# GET /api/phrase/practice/stats

練習統計を取得

## 認証
必須

## Query Parameters
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| languageId | string | Yes | 学習言語ID |

## Response (200 OK)
```json
{
  "success": true,
  "dailyCorrectCount": 5,
  "totalCorrectCount": 42,
  "weeklyRank": 3,
  "totalRank": 7
}
```
```

#### docs/api/ranking/get-ranking-practice.md

```markdown
# GET /api/ranking/practice

Practiceランキングを取得

## 認証
必須

## Query Parameters
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| language | string | Yes | 言語コード |
| period | "daily" \| "weekly" \| "total" | Yes | 期間 |

## Response (200 OK)
```json
{
  "success": true,
  "rankings": [...],
  "userRanking": { "rank": 3, "count": 42 }
}
```
```

### 2. components.mdへの追加（任意）

`FadeIn`, `StarProgress`, `PracticeHelpModal` コンポーネントの記載を追加。

---

## まとめ

| ドキュメント | 状態 |
|-------------|------|
| docs/api/README.md | ✅ 更新済み |
| docs/frontend/components.md | ✅ 更新済み（軽微な追加推奨） |
| docs/frontend/hooks.md | ✅ 更新済み |
| docs/backend/database.md | ✅ 更新済み |
| docs/shared/types.md | ✅ 更新済み |
| docs/architecture.md | ✅ 更新済み |
| docs/steering/20260117-practice-mode/ | ✅ 存在・整合 |
| CLAUDE.md | ✅ 更新済み |
| API個別ドキュメント | ⚠️ 作成推奨 |

Practice機能の実装に伴い、既存ドキュメントは適切に更新されています。API個別ドキュメントの作成は推奨ですが、必須ではありません。

---

**レポート作成日**: 2026-01-18
**対象ブランチ**: feature/20260117-practice-mode
**レビュアー**: review-docs agent
