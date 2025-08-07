# 日次リセットロジック仕様書

Solo Speakアプリケーションにおける、フレーズ生成回数とSpeakのTodayカウントの日次リセットロジックについて説明します。

## 共通仕様

- **リセット基準時刻**: UTC午前0時（協定世界時）
- **日付判定**: UTC基準での日付比較
- **リセット実行タイミング**: 該当APIが呼び出された時に判定・実行

### 世界各地でのリセット時刻
- **日本（JST）**: UTC午前0時 = 日本午前9時
- **バンクーバー（PST/PDT）**: UTC午前0時 = バンクーバー午後4時/5時
- **ニューヨーク（EST/EDT）**: UTC午前0時 = ニューヨーク午後7時/8時
- **ロンドン（GMT/BST）**: UTC午前0時 = ロンドン午前0時/1時

---

## 1. フレーズ生成回数リセット

### 対象機能
- **Phrase Add機能**でのフレーズ生成
- 1日5回まで生成可能（サブスクリプション有効時）

### リセット実行API

#### `GET /api/user/phrase-generations`
**実行タイミング**: Phrase Addページの読み込み時、生成回数表示の更新時

**リセット判定ロジック**:
```typescript
// 1. 現在のUTC日付を取得
const now = new Date()
const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

// 2. 最後の生成日をUTC基準の日付に変換
const lastGenerationDateUTC = new Date(lastGenerationDate)
const lastGenerationDayUTC = new Date(Date.UTC(
  lastGenerationDateUTC.getUTCFullYear(), 
  lastGenerationDateUTC.getUTCMonth(), 
  lastGenerationDateUTC.getUTCDate()
))

// 3. 日付比較でリセット判定
if (lastGenerationDayUTC.getTime() < todayUTC.getTime()) {
  // 日付が変わった場合のリセット処理
}
```

**リセット条件**:
1. `lastPhraseGenerationDate`が存在しない（初回）
2. 最後の生成日がUTC基準で今日より前

**リセット動作**:
- **サブスクリプション有効**: `remainingPhraseGenerations = 5` に復活
- **サブスクリプション無効**: `remainingPhraseGenerations = 0` のまま

**データベース更新**:
```sql
UPDATE users SET 
  remainingPhraseGenerations = 5,  -- または 0
  lastPhraseGenerationDate = NOW()
WHERE id = userId
```

### 自動検出機能
**フロントエンド**: `usePhraseManagerSWR.ts`で1分ごとにUTC日付変更を監視
```typescript
// UTC日付が変わったら自動的にAPI再実行
if (newUTCDate !== currentUTCDate) {
  mutateGenerations() // /api/user/phrase-generations を再実行
}
```

---

## 2. SpeakのTodayカウントリセット

### 対象機能
- **Speak練習機能**での1日の音読回数カウント（`dailySpeakCount`）
- 1日100回まで練習可能

### リセット実行API

#### `GET /api/phrase/speak`
**実行タイミング**: Speak練習開始時、次のフレーズ取得時

#### `GET /api/phrase/[id]/speak`
**実行タイミング**: 特定フレーズでのSpeak練習開始時

**リセット判定ロジック**:
```typescript
// src/utils/date-helpers.ts の isDayChanged 関数を使用
const isDayChangedFlag = isDayChanged(phrase.lastSpeakDate, currentDate)

// isDayChanged関数の内部処理（UTC基準）
const lastDateUTC = new Date(Date.UTC(
  lastSpeakDate.getUTCFullYear(),
  lastSpeakDate.getUTCMonth(),
  lastSpeakDate.getUTCDate()
))

const currentDateUTC = new Date(Date.UTC(
  currentDate.getUTCFullYear(),
  currentDate.getUTCMonth(),
  currentDate.getUTCDate()
))

return lastDateUTC.getTime() !== currentDateUTC.getTime()
```

**リセット動作**:
```typescript
// APIレスポンスでの値調整
const dailySpeakCount = isDayChangedFlag ? 0 : (phrase.dailySpeakCount || 0)
```

**注意**: データベースの`dailySpeakCount`は実際には更新されず、APIレスポンス時に動的に0として返される

### 実際のデータベース更新タイミング

#### `POST /api/phrase/[id]/count`
**実行タイミング**: Speak練習でCountボタンが押された時（ペンディングカウント送信時）

**リセット処理**:
```typescript
const isDayChangedFlag = isDayChanged(existingPhrase.lastSpeakDate, currentDate)

// 日付が変わった場合はdailySpeakCountをリセット
const dailyCountUpdate = isDayChangedFlag 
  ? countIncrement  // 新しい日なのでカウントをリセットして追加
  : { increment: countIncrement }  // 同じ日なので追加

// データベース更新
UPDATE phrases SET 
  dailySpeakCount = (新しい値またはインクリメント),
  totalSpeakCount = totalSpeakCount + countIncrement,
  lastSpeakDate = NOW()
WHERE id = phraseId
```

### 自動検出機能
**フロントエンド**: 
- `useSpeakPhrase.ts`: 複数フレーズモード用
- `useSinglePhraseSpeak.ts`: 単一フレーズモード用

```typescript
// UTC日付が変わったら自動的にデータ再取得
if (newUTCDate !== currentUTCDate) {
  fetchSpeakPhrase(config) // または refetchPhrase()
}
```

---

## 実行フロー例

### フレーズ生成回数リセットの場合

1. **ユーザーがPhrase Addページにアクセス**
2. `GET /api/user/phrase-generations` が実行される
3. `lastPhraseGenerationDate` と現在のUTC日付を比較
4. 日付が変わっていれば：
   - サブスクリプション状態をチェック
   - 有効なら `remainingPhraseGenerations = 5`
   - 無効なら `remainingPhraseGenerations = 0`
   - データベースを更新
5. フロントエンドに残り回数を返す

### SpeakのTodayカウントリセットの場合

1. **ユーザーがSpeak練習を開始**
2. `GET /api/phrase/speak` または `GET /api/phrase/[id]/speak` が実行される
3. `lastSpeakDate` と現在のUTC日付を比較
4. 日付が変わっていれば：
   - APIレスポンスで `dailySpeakCount = 0` として返す
   - （データベースは後でCount時に更新）
5. **ユーザーがCountボタンを押す**
6. `POST /api/phrase/[id]/count` が実行される
7. 再度日付チェックして、必要に応じて `dailySpeakCount` をリセット
8. データベースを更新

---

## 注意点

1. **リセットはAPI実行時のみ**: 自動的に深夜0時にリセットされるわけではなく、ユーザーがアプリを使用してAPIが呼ばれた時に判定・実行される

2. **タイムゾーン統一**: すべてUTC基準で統一されているため、世界中のユーザーが同じ時刻（UTC午前0時）でリセットされる

3. **フロントエンド自動検出**: 1分ごとの日付変更チェックにより、ユーザーがアプリを開いたままでも自動的にリセットが反映される

4. **SWRキャッシュ**: データの整合性を保つため、SWRによるキャッシュ管理と自動再検証を使用
