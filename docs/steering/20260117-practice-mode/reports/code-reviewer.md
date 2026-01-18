# コードレビュー結果レポート

## レビュー対象

feature/20260117-practice-mode ブランチ全体（mainからの差分）

- **変更ファイル数**: 99ファイル
- **コミット数**: 28コミット

### 主要カテゴリ

1. **API Routes** (src/app/api/phrase/practice/*, src/app/api/ranking/practice/*)
2. **フロントエンド** (src/app/phrase/practice/*, src/components/practice/*)
3. **カスタムフック** (src/hooks/practice/*)
4. **ユーティリティ** (src/utils/diff.ts, src/utils/similarity.ts)
5. **データベース** (prisma/schema.prisma)
6. **翻訳** (public/locales/*/app.json - 9言語)
7. **ドキュメント** (docs/*)

## 結果

✅ **問題なし（Zodバリデーション追加推奨）**

すべてのレビュー対象において、認証・認可、型安全性、コーディング規約の観点から重大な問題は検出されませんでした。

---

## 詳細

### Critical（即座に修正が必要）

**なし**

---

### Warning（修正推奨）

#### 1. Zodスキーマバリデーションの未使用

**該当ファイル**:
- `src/app/api/phrase/practice/route.ts`
- `src/app/api/phrase/practice/answer/route.ts`
- `src/app/api/phrase/practice/stats/route.ts`
- `src/app/api/ranking/practice/route.ts`

**問題**: APIルートでZodスキーマによるバリデーションが実装されていません。手動でのバリデーションは行われていますが、プロジェクト規約ではZodの使用が推奨されています。

**現状のバリデーション例**:
```typescript
// src/app/api/phrase/practice/route.ts
const languageId = searchParams.get("languageId");
const mode = searchParams.get("mode") as "normal" | "review";

if (!languageId || !mode) {
  return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
}
```

**推奨するZodスキーマ例**:
```typescript
import { z } from "zod";

const practiceQuerySchema = z.object({
  languageId: z.string().min(1),
  mode: z.enum(["normal", "review"]),
  questionCount: z.coerce.number().optional(),
});

// 使用
const result = practiceQuerySchema.safeParse({
  languageId: searchParams.get("languageId"),
  mode: searchParams.get("mode"),
  questionCount: searchParams.get("questionCount"),
});

if (!result.success) {
  return NextResponse.json({ error: result.error.issues }, { status: 400 });
}
```

**影響**: 低〜中。現状でも手動バリデーションで安全性は確保されていますが、Zodを使用することで型推論とバリデーションの一貫性が向上します。

---

### Info（参考情報）

#### 1. 認証・認可の実装（優秀）

すべてのAPIルートで `authenticateRequest()` が適切に使用されています。

```typescript
// 全APIルートで一貫した実装
const authResult = await authenticateRequest(request);
if (authResult.error) {
  return authResult.error;
}
const userId = authResult.session.user.id;
```

**確認済みファイル**:
- `src/app/api/phrase/practice/route.ts` ✅
- `src/app/api/phrase/practice/answer/route.ts` ✅
- `src/app/api/phrase/practice/stats/route.ts` ✅
- `src/app/api/ranking/practice/route.ts` ✅

#### 2. 型安全性（優秀）

- **`any`型の使用**: 0件
- **包括的な型定義**: `src/types/practice.ts` に全型が定義
- **TypeScript strict mode**: 有効

**主要な型定義**:
```typescript
export type PracticeMode = "normal" | "review";

export interface PracticePhrase {
  id: string;
  original: string;
  translation: string;
  practiceCorrectCount: number;
  createdAt: Date;
}

export interface DiffResult {
  type: "equal" | "insert" | "delete";
  value: string;
}
```

#### 3. データベース設計（優秀）

**スキーマ変更** (`prisma/schema.prisma`):

```prisma
// Userテーブルへの追加
model User {
  phraseMode              String   @default("practice")
  practiceIncludeExisting Boolean  @default(true)
  practiceStartDate       DateTime @default(now())
}

// Phraseテーブルへの追加
model Phrase {
  practiceCorrectCount   Int       @default(0)
  practiceIncorrectCount Int       @default(0)
  lastPracticeDate       DateTime?
}

// 新規テーブル
model PracticeLog {
  id        String   @id @default(cuid())
  userId    String
  phraseId  String
  correct   Boolean
  mode      String
  createdAt DateTime @default(now())

  @@index([userId, createdAt])
  @@index([phraseId])
}
```

**良い点**:
- 適切なインデックス設計
- 論理削除の考慮（既存パターンに準拠）
- トランザクション使用（answer APIで実装）

#### 4. アルゴリズム実装（優秀）

**Levenshtein距離** (`src/utils/similarity.ts`):
```typescript
export function calculateSimilarity(str1: string, str2: string): number {
  // 正規化後のLevenshtein距離計算
  // エッジケース（空文字、同一文字列）の適切な処理
}
```

**LCS差分計算** (`src/utils/diff.ts`):
```typescript
export function calculateDiff(
  transcript: string,
  expected: string,
  languageCode?: string
): DiffResult[] {
  // 言語に応じた単語単位/文字単位の切り替え
  // 日本語・中国語・タイ語: 文字単位
  // 英語・韓国語・欧州言語: 単語単位
}
```

**テストカバレッジ**:
- `src/utils/diff.test.ts` - 11テストケース
- `src/app/api/phrase/practice/route.test.ts` - 6テストケース
- `src/app/api/phrase/practice/answer/route.test.ts` - 8テストケース
- `src/app/api/ranking/practice/route.test.ts` - 5テストケース

#### 5. フロントエンド実装（優秀）

**コンポーネント設計**:
- 単一責任原則に準拠
- 適切な状態管理（useState, useCallback）
- カスタムフックによるロジック分離

**主要コンポーネント**:
| コンポーネント | 責務 |
|---------------|------|
| PracticePractice | 練習画面メイン |
| PracticeResult | 結果表示 |
| PracticeModeModal | モード選択 |
| DiffHighlight | 差分ハイライト |
| StarProgress | 進捗表示 |

**カスタムフック**:
| フック | 責務 |
|--------|------|
| usePracticeSession | セッション管理 |
| usePracticeAnswer | 回答送信・判定 |
| useSpeechRecognition | 音声認識 |

#### 6. セキュリティ対策（優秀）

**URLトークンによるアクセス制御**:
```typescript
// Practice開始時にトークン生成
const sessionToken = crypto.randomUUID();
sessionStorage.setItem("practiceSessionToken", sessionToken);

// ページロード時に検証
const urlSessionToken = params.get("sessionToken");
const storedSessionToken = sessionStorage.getItem("practiceSessionToken");

if (!urlSessionToken || urlSessionToken !== storedSessionToken) {
  router.push("/phrase/list");
  return;
}
```

**SQLインジェクション対策**: Prismaのパラメータ化クエリを使用

**XSS対策**: Reactのデフォルトエスケープを活用、`dangerouslySetInnerHTML`不使用

#### 7. 多言語対応（優秀）

**翻訳ファイル**: 9言語対応（en, ja, ko, zh, th, fr, es, pt, de）

**翻訳キー例**:
```json
{
  "practice": {
    "title": "Practice",
    "normalMode": "Normal",
    "reviewMode": "Review",
    "start": "Start",
    "next": "Next",
    "finish": "Finish"
  }
}
```

#### 8. FadeInアニメーション追加（優秀）

**実装パターン**:
```typescript
// src/components/common/FadeIn.tsx
export default function FadeIn({ children, className = "" }: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  return (
    <div
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.3s ease-out, transform 0.3s ease-out",
      }}
    >
      {children}
    </div>
  );
}
```

**使用箇所**: Phrase、Speech、Rankingの全ページ

---

## 修正提案

### 推奨（優先度: 中）

APIルートにZodスキーマバリデーションを追加することで、型安全性とバリデーションの一貫性が向上します。ただし、現状でも手動バリデーションにより安全性は確保されているため、必須ではありません。

---

## 総評

Practice機能の実装は以下の点で優れています：

1. **認証・認可**: 全APIで一貫した実装
2. **型安全性**: `any`型ゼロ、包括的な型定義
3. **データベース設計**: 適切なインデックス、トランザクション使用
4. **アルゴリズム**: Levenshtein距離、LCS差分計算が正確
5. **多言語対応**: 9言語の完全な翻訳
6. **テストカバレッジ**: 主要APIのテスト実装
7. **セキュリティ**: URLトークン、SQLインジェクション/XSS対策

プロジェクトのコーディング規約に準拠しており、本番環境へのデプロイに適しています。

---

**レビュー実施日**: 2026-01-18
**対象ブランチ**: feature/20260117-practice-mode
**レビュアー**: Claude Code (Code Reviewer Agent)
