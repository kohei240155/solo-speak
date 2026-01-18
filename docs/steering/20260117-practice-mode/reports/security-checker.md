# セキュリティチェック結果レポート

**ブランチ**: feature/20260117-practice-mode  
**チェック日時**: 2026-01-18  
**チェック対象**: Practice機能（発話練習機能）の全変更

---

## チェック対象

**変更ファイル数**: 99ファイル

**主要カテゴリ**:
- API Routes: 6ファイル（新規）
- Database Schema: 1ファイル（PracticeLog追加、Userテーブル拡張）
- フロントエンドコンポーネント: 5ファイル（Practice関連）
- カスタムフック: 3ファイル（Practice関連）
- ユーティリティ: 2ファイル（similarity, diff計算）
- 型定義: 1ファイル（practice.ts）
- 翻訳ファイル: 18ファイル（多言語対応）

---

## 結果

✅ **問題なし**

全体評価: **安全** - Critical脆弱性なし、重大な問題なし

---

## 詳細

### Critical（即座に修正が必要）

**なし**

すべてのAPI Routesで以下のセキュリティベストプラクティスが適切に実装されています：
- ✅ `authenticateRequest()` による認証チェック
- ✅ 所有者確認（`phrase.userId === authResult.user.id`）
- ✅ 入力バリデーション
- ✅ Prismaトランザクションの使用
- ✅ エラーハンドリング

---

### Warning（修正推奨）

#### 1. `$queryRaw` の使用（SQLインジェクションリスク軽減済み）

**ファイル**: `src/app/api/phrase/practice/stats/route.ts`

**箇所**:
- L142-151: 週間ランキング取得
- L178-186: 累計ランキング取得

**現状**:
```typescript
const weeklyStats = await prisma.$queryRaw<{ user_id: string; count: bigint }[]>`
  SELECT pl.user_id, COUNT(pl.id) as count
  FROM practice_logs pl
  INNER JOIN phrases p ON pl.phrase_id = p.id
  WHERE pl.correct = true
  AND pl.practice_date >= ${weekStart}
  AND p.language_id = ${languageId}
  GROUP BY pl.user_id
  ORDER BY count DESC
`;
```

**評価**:
- ✅ **パラメータ化クエリを使用**しており、SQLインジェクションのリスクは低い
- ✅ `weekStart`（Date）、`languageId`（認証済みユーザーのクエリパラメータ）がパラメータ化されている
- ⚠️ ただし、`$queryRaw` の使用は可能な限り避けることが推奨される

**理由**:
Prisma Clientの通常のクエリメソッド（`groupBy`）では、リレーション経由でのフィルタリング（`phrase.languageId`）が実装困難なため、`$queryRaw` の使用は妥当。

**推奨事項**:
- **現状維持で問題なし**
- 将来的にPrismaが改善されれば、標準クエリメソッドへの移行を検討

---

#### 2. エラーメッセージの詳細露出（情報漏洩リスク）

**ファイル**: 複数のAPI Routes

**現状**:
一部のエラーレスポンスで汎用的なメッセージを返している箇所と、やや詳細なメッセージを返している箇所が混在しています。

**例**:
```typescript
// 良い例（汎用メッセージ）
return NextResponse.json({ error: "Internal server error" }, { status: 500 });

// 注意が必要な例（詳細メッセージ）
return NextResponse.json({ error: `Language with id '${languageId}' not found` }, { status: 404 });
```

**評価**:
- ✅ 404エラーで言語IDが見つからない旨を返すのは、一般的には問題なし
- ⚠️ ただし、攻撃者に有効な言語IDを推測される可能性がある

**推奨事項**:
- **現状維持で問題なし**（ユーザビリティとのバランスが取れている）
- より厳格にする場合は「Invalid language selection」等の汎用メッセージに変更

---

### Info（参考情報）

#### 1. 認証・認可の実装状況

**評価**: ✅ **優れている**

すべてのPractice関連API Routesで以下が適切に実装されています：

**認証**:
```typescript
const authResult = await authenticateRequest(request);
if ("error" in authResult) {
  return authResult.error; // 401 Unauthorized
}
```

**認可（所有者確認）**:
```typescript
// POST /api/phrase/practice/answer
if (phrase.userId !== authResult.user.id) {
  return NextResponse.json({ error: "Access denied" }, { status: 403 });
}
```

**該当ファイル**:
- ✅ `src/app/api/phrase/practice/route.ts`
- ✅ `src/app/api/phrase/practice/answer/route.ts`
- ✅ `src/app/api/phrase/practice/stats/route.ts`
- ✅ `src/app/api/ranking/practice/route.ts`
- ✅ `src/app/api/user/settings/route.ts`（Practice設定を含む）

---

#### 2. 入力バリデーション

**評価**: ✅ **適切**

すべてのAPI Routesで入力バリデーションが実装されています。

**クエリパラメータ**:
```typescript
// GET /api/phrase/practice
if (!languageId) {
  return NextResponse.json({ error: "languageId parameter is required" }, { status: 400 });
}

if (!mode || (mode !== "normal" && mode !== "review")) {
  return NextResponse.json({ error: 'mode parameter must be "normal" or "review"' }, { status: 400 });
}
```

**リクエストボディ**:
```typescript
// POST /api/phrase/practice/answer
if (!phraseId) {
  return NextResponse.json({ error: "phraseId is required" }, { status: 400 });
}

if (transcript === undefined || transcript === null) {
  return NextResponse.json({ error: "transcript is required" }, { status: 400 });
}
```

---

#### 3. データベースセキュリティ

**評価**: ✅ **適切**

**RLS（Row Level Security）の代替実装**:
```typescript
// ユーザーIDでフィルタリング
const whereCondition = {
  userId: authResult.user.id,
  languageId: languageId,
  deletedAt: null,
  speechId: null,
};

const phrases = await prisma.phrase.findMany({ where: whereCondition });
```

**トランザクション**:
```typescript
// POST /api/phrase/practice/answer
await prisma.$transaction(async (tx) => {
  await tx.phrase.update({ ... });
  await tx.practiceLog.create({ ... });
});
```

**論理削除**:
```typescript
// 削除済みデータの除外
where: { deletedAt: null }
```

---

#### 4. フロントエンドセキュリティ

**評価**: ✅ **安全**

**XSS対策**:
- ❌ `dangerouslySetInnerHTML` の使用なし
- ✅ Reactのデフォルトエスケープを使用

**機密情報の管理**:
- ✅ APIキーやシークレットはサーバーサイドのみ
- ✅ クライアントサイドでの機密情報漏洩なし

**該当ファイル**:
- `src/components/practice/PracticePractice.tsx`
- `src/components/practice/PracticeResult.tsx`
- `src/components/practice/DiffHighlight.tsx`

---

#### 5. ユーティリティ関数のセキュリティ

**評価**: ✅ **安全**

**similarity.ts（類似度計算）**:
- ✅ 純粋な計算関数、外部入力なし
- ✅ Levenshtein距離アルゴリズムの適切な実装

**diff.ts（差分計算）**:
- ✅ 純粋な計算関数、外部入力なし
- ✅ LCS（最長共通部分列）アルゴリズムの適切な実装
- ✅ 言語に応じた処理の分岐（文字単位/単語単位）

---

#### 6. データベーススキーマの変更

**評価**: ✅ **適切**

**PracticeLogテーブル**:
```sql
model PracticeLog {
  id           String   @id @default(cuid())
  phraseId     String   @map("phrase_id")
  userId       String   @map("user_id")
  correct      Boolean
  similarity   Float
  transcript   String?
  practiceDate DateTime @map("practice_date")
  createdAt    DateTime @default(now()) @map("created_at")

  phrase Phrase @relation(fields: [phraseId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([phraseId])
  @@index([userId])
  @@index([userId, practiceDate])
  @@map("practice_logs")
}
```

**セキュリティ観点**:
- ✅ 適切なインデックス設定（パフォーマンス向上）
- ✅ `onDelete: Cascade` による整合性保持
- ✅ ユーザーIDとフレーズIDの外部キー制約

**Userテーブル拡張**:
- ✅ `practiceIncludeExisting` (Boolean): 既存フレーズを含めるか
- ✅ `practiceStartDate` (DateTime): 練習開始日（フィルタリング用）
- ✅ デフォルト値の適切な設定

---

#### 7. OWASP Top 10 チェック

| 脆弱性 | 評価 | 詳細 |
|--------|------|------|
| **A01:2021 – Broken Access Control** | ✅ 安全 | 認証・認可が適切に実装されている |
| **A02:2021 – Cryptographic Failures** | ✅ 安全 | JWT認証、HTTPS通信（本番環境想定） |
| **A03:2021 – Injection** | ✅ 安全 | Prismaパラメータ化クエリ、`$queryRaw`でもパラメータ化 |
| **A04:2021 – Insecure Design** | ✅ 安全 | 適切な認証・認可設計 |
| **A05:2021 – Security Misconfiguration** | ✅ 安全 | `.env`ファイルの適切な管理 |
| **A06:2021 – Vulnerable Components** | ⚠️ 要確認 | `npm audit`で依存関係の脆弱性チェック推奨 |
| **A07:2021 – Identification/Authentication Failures** | ✅ 安全 | Supabase認証の適切な使用 |
| **A08:2021 – Software and Data Integrity Failures** | ✅ 安全 | トランザクションによる整合性保証 |
| **A09:2021 – Security Logging/Monitoring Failures** | ⚠️ 改善余地 | ログ機能は最小限（本番環境では監視ツール推奨） |
| **A10:2021 – Server-Side Request Forgery (SSRF)** | N/A | 外部URLへのリクエストなし |

---

## 修正提案

### なし

**理由**:
- すべてのCritical脆弱性は検出されませんでした
- Warningレベルの問題は、すでに適切な軽減策が実装されています
- 現在の実装はセキュリティベストプラクティスに準拠しています

---

## セキュリティベストプラクティスの確認

### ✅ 実装されている項目

1. **認証・認可**
   - すべてのAPI Routesで`authenticateRequest()`を使用
   - 所有者確認による認可チェック

2. **入力バリデーション**
   - クエリパラメータの検証
   - リクエストボディの検証
   - 型チェック

3. **SQLインジェクション対策**
   - Prismaパラメータ化クエリの使用
   - `$queryRaw`でもパラメータ化

4. **XSS対策**
   - Reactのデフォルトエスケープ
   - `dangerouslySetInnerHTML`の不使用

5. **データベースセキュリティ**
   - ユーザーIDでのフィルタリング
   - 論理削除（`deletedAt`）の使用
   - トランザクションによる整合性保証

6. **エラーハンドリング**
   - try-catchによる適切なエラー処理
   - 汎用エラーメッセージの返却

---

## 追加推奨事項

### 1. 依存関係の脆弱性チェック

```bash
npm audit
```

定期的に実行し、脆弱性のあるパッケージを更新してください。

### 2. 本番環境での監視

- APIエンドポイントのレート制限
- 異常なアクセスパターンの検知
- エラーログの集約・監視

### 3. セキュリティテスト

- ペネトレーションテスト（本番リリース前）
- SAST（Static Application Security Testing）ツールの導入検討

---

## 総評

**Practice機能の実装は、セキュリティ観点から非常に高品質です。**

- すべてのAPI Routesで認証・認可が適切に実装されています
- 入力バリデーションが徹底されています
- SQLインジェクション、XSS等の一般的な脆弱性への対策が実装されています
- データベースアクセスが適切に制限されています

**本番環境へのデプロイに向けて、セキュリティ上の大きな懸念はありません。**

---

**チェック担当**: Security Checker Agent  
**チェック完了日時**: 2026-01-18
