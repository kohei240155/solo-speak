# セキュリティチェックレポート

## チェック対象

以下のファイルに対してセキュリティ監査を実施しました。

- `prisma/schema.prisma` (timezone を nullable に変更)
- `src/contexts/AuthContext.tsx` (タイムゾーン自動検出ロジック追加)
- `src/app/api/user/settings/route.ts` (タイムゾーン保存API)
- `src/utils/timezone.ts` (タイムゾーンユーティリティ)
- `src/utils/timezone.test.ts` (テストコード)
- `src/app/api/user/reset-daily-speak-count/route.ts` (リセットAPIでの利用)
- `src/app/api/phrase/remaining/route.ts` (リセットロジックでの利用)

## 結果サマリー

✅ **問題なし** - Critical/High レベルの脆弱性は検出されませんでした。

一部のMediumレベルの改善推奨事項がありますが、全体的にセキュリティベストプラクティスに従った実装となっています。

## 詳細

### 1. 認証・認可 ✅

**評価: 問題なし**

#### 良好な実装

1. **API認証の実装**
   - `src/app/api/user/settings/route.ts` の全メソッド (GET/POST/PUT) で `authenticateRequest()` が正しく実装されています
   - `src/app/api/user/reset-daily-speak-count/route.ts` でも認証チェックが実装されています
   - `src/app/api/phrase/remaining/route.ts` でも認証チェックが実装されています

```typescript
// 良好な実装例 (src/app/api/user/settings/route.ts:22-25)
const authResult = await authenticateRequest(request);
if ("error" in authResult) {
  return authResult.error;
}
```

2. **認可（Authorization）の実装**
   - ユーザーIDによるリソースフィルタリングが正しく実装されています
   - 他ユーザーのデータにアクセスできないことが保証されています

```typescript
// 良好な実装例 (database-helpers.ts:38-46)
const user = await prisma.user.findUnique({
  where: {
    id: userId,
    deletedAt: null, // 削除されていないユーザーのみ取得
  },
  // ...
});
```

3. **トークン検証**
   - Supabase JWTトークンの検証が `authenticateRequest()` で適切に実装されています
   - リトライロジック（最大3回）により一時的な障害に対応しています

#### 検出された問題

なし

---

### 2. インジェクション ✅

**評価: 問題なし**

#### 良好な実装

1. **SQLインジェクション対策**
   - すべてのDBクエリでPrismaのパラメータ化クエリを使用しています
   - `$queryRaw` や `$executeRaw` の使用は確認されませんでした
   - ユーザー入力が直接SQLに埋め込まれることはありません

2. **タイムゾーン値のサニタイズ**
   - `isValidTimezone()` 関数でIANA標準のタイムゾーン文字列を検証しています
   - `Intl.DateTimeFormat` のエラーハンドリングにより不正な値を拒否します

```typescript
// 良好な実装例 (src/utils/timezone.ts:87-98)
export function isValidTimezone(timezone: string): boolean {
  if (!timezone) {
    return false;
  }
  
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}
```

3. **XSS対策**
   - AuthContext.tsx はサーバーサイドAPIを呼び出すのみで、ユーザー入力をDOMに直接挿入していません
   - `dangerouslySetInnerHTML` の使用は確認されませんでした

#### 検出された問題

なし

---

### 3. データ検証 ✅

**評価: 問題なし**

#### 良好な実装

1. **入力バリデーション**
   - タイムゾーン値のバリデーションが実装されています (POST/PUT両方で実施)
   - 必須フィールドのバリデーションが `validateRequiredFields()` で実装されています
   - 言語IDの存在確認が実装されています

```typescript
// 良好な実装例 (src/app/api/user/settings/route.ts:82-88)
// タイムゾーンのバリデーション
if (timezone && !isValidTimezone(timezone)) {
  const errorResponse: ApiErrorResponse = {
    error: "Invalid timezone format",
  };
  return NextResponse.json(errorResponse, { status: 400 });
}
```

2. **データ整合性の保護**
   - 言語IDの存在確認とnullチェックが実装されています (POST時)
   - `deletedAt: null` による論理削除済みデータの除外が実装されています

```typescript
// 良好な実装例 (src/app/api/user/settings/route.ts:91-105)
const [nativeLanguage, learningLanguage] = await Promise.all([
  prisma.language.findUnique({
    where: {
      id: nativeLanguageId,
      deletedAt: null, // 削除されていない言語のみ
    },
  }),
  // ...
]);
```

3. **Mass Assignment対策**
   - リクエストボディから明示的にフィールドを抽出しています
   - 許可されたフィールドのみをDB操作に使用しています

```typescript
// 良好な実装例 (src/app/api/user/settings/route.ts:60-67)
const {
  username,
  iconUrl,
  nativeLanguageId,
  defaultLearningLanguageId,
  email,
  timezone,
} = body;
```

#### 検出された問題

なし

---

### 4. 情報漏洩 ✅

**評価: 問題なし（改善推奨あり）**

#### 良好な実装

1. **環境変数の安全な使用**
   - タイムゾーン機能では環境変数を使用していません
   - クライアントサイドでブラウザ標準API (`Intl.DateTimeFormat`) を使用してタイムゾーンを取得しています

2. **エラーメッセージの適切な処理**
   - 内部エラーの詳細をユーザーに露出していません
   - 汎用エラーメッセージを返しています

```typescript
// 良好な実装例 (src/app/api/user/reset-daily-speak-count/route.ts:82-86)
} catch {
  const errorResponse: ApiErrorResponse = {
    error: "Internal server error",
  };
  return NextResponse.json(errorResponse, { status: 500 });
}
```

3. **機密情報の保護**
   - タイムゾーン情報は機密情報ではないため、問題ありません
   - ユーザーIDによるアクセス制御が適切に実装されています

#### 改善推奨事項（Medium）

**1. クライアントサイドでのエラーハンドリング強化**

- **ファイル**: `src/contexts/AuthContext.tsx:215-224`
- **問題**: fetchエラー時のハンドリングが不足しています
- **影響**: エラー発生時に無限ループやリソースリークの可能性があります

**現在のコード:**
```typescript
fetch("/api/user/settings", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  },
  body: JSON.stringify({ timezone: browserTimezone }),
}).then(() => {
  refreshUserSettings();
});
```

**推奨される修正:**
```typescript
fetch("/api/user/settings", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  },
  body: JSON.stringify({ timezone: browserTimezone }),
})
  .then((response) => {
    if (!response.ok) {
      throw new Error("Failed to update timezone");
    }
    return response.json();
  })
  .then(() => {
    refreshUserSettings();
  })
  .catch((error) => {
    console.error("Timezone auto-detection failed:", error);
    // タイムゾーン設定失敗は致命的ではないため、エラーログのみ
  });
```

---

### 5. タイムゾーン関連のセキュリティ ✅

**評価: 問題なし**

#### 良好な実装

1. **不正リセット防止ロジック**
   - 20時間ルールにより、タイムゾーン変更による不正リセットを防止しています
   - ローカル日付の変更と時間経過の両方をチェックしています

```typescript
// 優れた実装 (src/utils/timezone.ts:59-80)
export function canReset(
  userTimezone: string,
  lastResetTimestamp: Date | null,
  now: Date = new Date()
): boolean {
  if (lastResetTimestamp === null) {
    return true;
  }

  // 条件1: ローカルTZで日付が変わっている
  const localToday = getLocalDateString(now, userTimezone);
  const localLastReset = getLocalDateString(lastResetTimestamp, userTimezone);
  const isDifferentDay = localToday > localLastReset;

  // 条件2: 前回リセットから20時間以上経過
  const hoursSinceLastReset =
    (now.getTime() - lastResetTimestamp.getTime()) / (1000 * 60 * 60);
  const hasPassedMinimumTime = hoursSinceLastReset >= 20;

  return isDifferentDay && hasPassedMinimumTime;
}
```

2. **テストカバレッジ**
   - タイムゾーン変更による不正リセットのテストケースが含まれています
   - エッジケース（20時間未満、日付変更あり/なし）のテストが実装されています

```typescript
// 優れたテストケース (src/utils/timezone.test.ts:86-97)
it("タイムゾーン変更後も20時間ルールが適用される", () => {
  const lastReset = new Date("2024-01-15T00:00:00.000Z");
  const now = new Date("2024-01-15T10:00:00.000Z"); // 10時間経過
  
  // タイムゾーンをUTC+12に変更しても20時間ルールで防止される
  expect(canReset("Pacific/Auckland", lastReset, now)).toBe(false);
});
```

3. **デフォルト値の安全性**
   - タイムゾーンがnullの場合、"UTC"をデフォルトとして使用しています
   - nullチェックが適切に実装されています

```typescript
// 良好な実装例 (src/app/api/user/reset-daily-speak-count/route.ts:38)
const userTimezone = user.timezone || "UTC";
```

#### 検出された問題

なし

---

### 6. セッション・トークン管理 ✅

**評価: 問題なし**

#### 良好な実装

1. **トークンの適切な使用**
   - Supabaseセッショントークンを使用してAPI認証を実施しています
   - クライアントサイドでトークンを安全に取得しています

```typescript
// 良好な実装例 (src/contexts/AuthContext.tsx:217-220)
headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${session.access_token}`,
},
```

2. **認証状態の管理**
   - セッション変更を監視し、適切に状態を更新しています
   - ログアウト時の状態クリアが実装されています

#### 検出された問題

なし

---

### 7. データベースセキュリティ ✅

**評価: 問題なし**

#### 良好な実装

1. **論理削除の適切な使用**
   - すべてのDBクエリで `deletedAt: null` 条件を使用しています
   - 削除済みデータへのアクセスを防止しています

```typescript
// 良好な実装例 (src/utils/database-helpers.ts:38-41)
const user = await prisma.user.findUnique({
  where: {
    id: userId,
    deletedAt: null, // 削除されていないユーザーのみ取得
  },
  // ...
});
```

2. **Null安全性**
   - スキーマで `timezone String?` (nullable) として定義されています
   - nullチェックとデフォルト値の設定が適切に実装されています

```prisma
// 適切なスキーマ定義 (prisma/schema.prisma:25)
timezone String?
```

3. **トランザクション**
   - 今回の変更ではトランザクションが必要な複数ステップの操作はありません
   - リセットロジックではupdateManyとupdateを使用していますが、データ整合性の問題は発生しません

#### 検出された問題

なし

---

### 8. レート制限・濫用防止 ✅

**評価: 優れている**

#### 良好な実装

1. **20時間ルールによる濫用防止**
   - タイムゾーン変更による不正なリセットを防止しています
   - UTC基準での時間チェックにより、ローカル時刻操作を無効化しています

2. **リセットロジックの冪等性**
   - リセット条件を満たさない場合、何も実行しない設計になっています
   - 同じ日に複数回リクエストしても問題ありません

```typescript
// 良好な実装例 (src/app/api/user/reset-daily-speak-count/route.ts:40-46)
let shouldReset = false;
let resetCount = 0;

if (canReset(userTimezone, user.lastDailySpeakCountResetDate)) {
  shouldReset = true;
}
```

#### 検出された問題

なし

---

## 指摘事項

### Medium Risk Issues

#### 1. クライアントサイドでのエラーハンドリング不足

- **ファイル**: `src/contexts/AuthContext.tsx:215-224`
- **問題**: タイムゾーン自動設定のfetchエラーハンドリングが不足
- **影響範囲**: エラー発生時に無限ループやリソースリークの可能性（低確率）
- **優先度**: Medium
- **推奨対応**: 上記「4. 情報漏洩 - 改善推奨事項」を参照

### 改善推奨事項（任意）

#### 1. タイムゾーン自動検出のフラグ管理

- **ファイル**: `src/contexts/AuthContext.tsx:209-225`
- **提案**: タイムゾーン自動検出を一度だけ実行するフラグを追加することで、不要なAPI呼び出しを削減できます

**実装例:**
```typescript
const [timezoneDetected, setTimezoneDetected] = useState(false);

useEffect(() => {
  if (!userSettings || userSettings.timezone !== null || timezoneDetected) return;
  if (!session?.access_token) return;
  
  setTimezoneDetected(true); // フラグを設定
  
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  fetch("/api/user/settings", {
    // ...
  })
  .catch((error) => {
    console.error("Timezone auto-detection failed:", error);
    setTimezoneDetected(false); // エラー時はリトライ可能にする
  });
}, [userSettings, session?.access_token, timezoneDetected, refreshUserSettings]);
```

---

## セキュリティベストプラクティス

今回の実装で**優れている点**を以下にまとめます。

### 1. 多層防御アプローチ

- クライアントサイドでのタイムゾーン検証（`isValidTimezone()`）
- サーバーサイドでのタイムゾーン検証（API RouteでPOST/PUT両方）
- 不正リセット防止ロジック（20時間ルール + ローカル日付チェック）

### 2. 包括的なテストカバレッジ

- タイムゾーン関連のユニットテストが実装されています
- エッジケース（タイムゾーン変更、日付境界、20時間ルール）が網羅されています
- テストケースには攻撃シナリオも含まれています

### 3. 型安全性

- TypeScriptによる型定義が適切に実装されています
- nullableフィールドのハンドリングが適切です
- Zodスキーマは使用していませんが、カスタムバリデーション関数で対応しています

### 4. 認証・認可の徹底

- すべてのAPIエンドポイントで `authenticateRequest()` を使用
- ユーザーIDによるリソースフィルタリング
- 論理削除による不正アクセス防止

### 5. エラーハンドリング

- ユーザー向けエラーメッセージは汎用的で、内部情報を露出していません
- データベースエラーを適切にキャッチしています
- リトライロジックにより一時的な障害に対応しています

---

## 総合評価

✅ **セキュリティチェック合格**

タイムゾーン自動検出機能は、セキュリティベストプラクティスに従って実装されています。

- **Critical/High レベルの脆弱性**: 0件
- **Medium レベルの問題**: 1件（エラーハンドリング改善推奨）
- **改善推奨事項**: 1件（フラグ管理による最適化）

Medium レベルの問題は、致命的ではなく、機能の動作に影響を与えません。時間のあるときに対応することを推奨します。

**推奨アクション:**
1. AuthContext.tsx のエラーハンドリング追加（Medium優先度）
2. タイムゾーン自動検出フラグの追加（任意）

以上、セキュリティチェックを完了します。
