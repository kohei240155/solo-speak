# {機能名} - 技術設計

**ステータス**: 下書き | レビュー中 | 承認済み
**作成日**: {YYYY-MM-DD}
**最終更新日**: {YYYY-MM-DD}
**要件**: [requirements.md](./requirements.md)

---

## 1. アーキテクチャ概要

### システムフロー

<!-- 処理の流れをステップで記述 -->

1. <!-- ステップ1 -->
2. <!-- ステップ2 -->
3. <!-- ステップ3 -->

### 主要コンポーネント

| コンポーネント | パス | 責務 |
|---------------|------|------|
| <!-- 名前 --> | `@/path/to/file` | <!-- 役割の説明 --> |
| <!-- 名前 --> | `@/path/to/file` | <!-- 役割の説明 --> |

---

## 2. データ設計

### 新規/変更テーブル

```sql
-- 例: 新規テーブル
CREATE TABLE entity_name (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    field_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP  -- 論理削除
);

-- インデックス
CREATE INDEX idx_entity_user ON entity_name(user_id);
```

### Prismaスキーマ

```prisma
model EntityName {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  fieldName String   @map("field_name")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  user User @relation(fields: [userId], references: [id])

  @@map("entity_name")
}
```

### 既存テーブルへの影響

- [ ] 影響なし
- [ ] 以下のテーブルに影響:
  - `table_name`: <!-- 変更内容 -->

---

## 3. API設計

### エンドポイント一覧

| メソッド | パス | 説明 | 認証 |
|----------|------|------|------|
| POST | `/api/resource` | リソース作成 | 必須 |
| GET | `/api/resource/{id}` | リソース取得 | 必須 |
| PUT | `/api/resource/{id}` | リソース更新 | 必須 |
| DELETE | `/api/resource/{id}` | リソース削除 | 必須 |

### リクエスト/レスポンス型

```typescript
// POST /api/resource - リクエスト
const CreateResourceSchema = z.object({
  field: z.string().min(1).max(255),
});
type CreateResourceRequest = z.infer<typeof CreateResourceSchema>;

// レスポンス
interface ResourceResponse {
  id: string;
  field: string;
  createdAt: string;
  updatedAt: string;
}
```

### エラーハンドリング

| エラーコード | HTTPステータス | 説明 |
|-------------|----------------|------|
| RESOURCE_NOT_FOUND | 404 | リソースが存在しない |
| VALIDATION_ERROR | 400 | 入力が無効 |
| UNAUTHORIZED | 401 | 認証エラー |
| FORBIDDEN | 403 | 権限エラー |

---

## 4. UI設計

### 画面構成

<!-- 追加/変更する画面とその概要 -->

### コンポーネント構成

<!-- 新規作成するコンポーネントと既存コンポーネントとの関係 -->

```
ParentComponent
├── NewComponent
│   ├── SubComponentA
│   └── SubComponentB
└── ExistingComponent（修正）
```

### 状態管理

<!-- フロントエンドの状態管理方針 -->

---

## 5. セキュリティとパフォーマンス

### セキュリティ考慮事項

- [ ] 認証: `authenticateRequest()` 使用
- [ ] 認可: ユーザー所有データのみアクセス可能
- [ ] 入力検証: Zodスキーマでバリデーション
- [ ] <!-- その他の考慮事項 -->

### パフォーマンス考慮事項

- [ ] インデックス設計: <!-- 対象カラム -->
- [ ] クエリ最適化: <!-- 必要な対応 -->
- [ ] キャッシュ: <!-- 戦略 -->

---

## 6. テスト戦略

### テスト方針

<!-- 全体的なテストアプローチ -->

### テストケース

#### 正常系
- [ ] <!-- テストケース -->
- [ ] <!-- テストケース -->

#### 異常系
- [ ] <!-- テストケース -->
- [ ] <!-- テストケース -->

#### 境界値
- [ ] <!-- テストケース -->

---

## 7. 影響範囲

### 直接影響を受けるファイル

| ファイル | 変更内容 | 影響レベル |
|----------|----------|-----------|
| `path/to/file` | <!-- 変更内容 --> | Critical / High / Medium / Low |

### 間接的に影響を受ける可能性のあるファイル

- `path/to/file` - <!-- 確認が必要な理由 -->

---

## 8. リスクと代替案

### リスク

| リスク | 影響度 | 軽減策 |
|--------|--------|--------|
| <!-- リスク1 --> | 高 / 中 / 低 | <!-- 軽減策 --> |

### 検討した代替案

#### 代替案A: {名前}

- **説明**: <!-- 概要 -->
- **メリット**: <!-- 利点 -->
- **デメリット**: <!-- 欠点 -->
- **却下理由**: <!-- 選択しなかった理由 -->

---

## 9. 未解決の質問

- [ ] <!-- 質問1 -->
- [ ] <!-- 質問2 -->

---

## 参考資料

- <!-- 関連ドキュメントへのリンク -->
- <!-- 参考実装へのリンク -->
