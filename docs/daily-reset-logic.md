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

#### `POST /api/user/reset-daily-speak-count` ⭐ **NEW**
**実行タイミング**: Speak Modeモーダルを開いた瞬間（自動実行）

**リセット判定ロジック**:
```typescript
// UTC基準での日付比較
const now = new Date()
const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

// ユーザーのlastSpeakingDateをUTC基準の日付に変換
const lastSpeakingDateUTC = new Date(user.lastSpeakingDate)
const lastSpeakingDayUTC = new Date(Date.UTC(
  lastSpeakingDateUTC.getUTCFullYear(), 
  lastSpeakingDateUTC.getUTCMonth(), 
  lastSpeakingDateUTC.getUTCDate()
))

// 日付比較でリセット判定
if (lastSpeakingDayUTC.getTime() < todayUTC.getTime()) {
  // 日付が変わった場合のリセット処理
}
```

**リセット条件**:
1. `lastSpeakingDate`が存在しない（初回）
2. 最後のスピーキング日がUTC基準で今日より前

**リセット動作**:
```typescript
// ユーザーに紐づく全てのフレーズのdailySpeakCountを0にリセット
await prisma.phrase.updateMany({
  where: { userId: userId, deletedAt: null },
  data: { dailySpeakCount: 0 }
})

// ユーザーのlastSpeakingDateを更新
await prisma.user.update({
  where: { id: userId },
  data: { lastSpeakingDate: new Date() }
})
```

#### `GET /api/phrase/speak`
**実行タイミング**: Speak練習開始時、次のフレーズ取得時
**機能**: フィルタリング条件に基づいてフレーズを取得

#### `GET /api/phrase/[id]/speak`
**実行タイミング**: 特定フレーズでのSpeak練習開始時
**機能**: 指定されたフレーズIDのSpeak練習データを取得

**注意**: これらのAPIは単純にデータを取得するだけで、日付リセット処理は行いません。リセット処理は`POST /api/user/reset-daily-speak-count`APIで一元化されています。

### 実際のデータベース更新タイミング

#### `POST /api/phrase/[id]/count`
**実行タイミング**: Speak練習でCountボタンが押された時（ペンディングカウント送信時）

**処理内容**:
```typescript
// 単純にカウントを追加（日付チェックは不要、既にモーダル開封時にリセット済み）
UPDATE phrases SET 
  dailySpeakCount = dailySpeakCount + countIncrement,
  totalSpeakCount = totalSpeakCount + countIncrement,
  lastSpeakDate = NOW()
WHERE id = phraseId
```

**注意**: 日付変更時のリセット処理は`POST /api/user/reset-daily-speak-count`で既に完了しているため、このAPIでは単純にカウントを追加するだけです。

### Speak Modeモーダルでの統合リセット

**実行タイミング**: ユーザーがSpeake Modeモーダルを開いた瞬間

**実行される処理**:
1. `resetSessionSpoken()` - セッション練習状態をリセット
2. `resetDailySpeakCount()` - 日次音読カウントをリセット（UTC基準での日付判定）

**動作フロー**:
```typescript
// SpeakModeModal.tsx
useEffect(() => {
  if (isOpen) {
    const resetSession = async () => {
      await resetSessionSpoken()  // 既存のセッションリセット
    }
    
    const resetDailyCount = async () => {
      await resetDailySpeakCount()  // 新しい日次カウントリセット
    }
    
    resetSession()
    resetDailyCount()
  }
}, [isOpen])
```

このにより、Speak Modeモーダルを開くだけで：
- **セッション練習状態**（`sessionSpoken`）がリセットされ
- **日次音読カウント**（`dailySpeakCount`）も日付変更時に自動的にリセットされる

ユーザーは何も考えずにSpeak Modeモーダルを開けば、適切なリセット処理が自動実行されます。

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

1. **ユーザーがSpeak Modeモーダルを開く**
2. `POST /api/user/reset-daily-speak-count` が自動実行される
3. `lastSpeakingDate` と現在のUTC日付を比較
4. 日付が変わっていれば：
   - ユーザーに紐づく全フレーズの `dailySpeakCount = 0` にリセット
   - ユーザーの `lastSpeakingDate` を現在時刻に更新
5. **ユーザーがSpeak練習を開始**
6. `GET /api/phrase/speak` または `GET /api/phrase/[id]/speak` が実行される（データ取得のみ）
7. **ユーザーがCountボタンを押す**
8. `POST /api/phrase/[id]/count` が実行される
9. データベースを更新（日付チェックは不要、既にリセット済み）

---

## 注意点

1. **リセットはSpeak Modeモーダル開封時**: 新しいAPIにより、Speak Modeモーダルを開いた瞬間に日次リセットが判定・実行される

2. **タイムゾーン統一**: すべてUTC基準で統一されているため、世界中のユーザーが同じ時刻（UTC午前0時）でリセットされる

3. **Speak Modeモーダルでの統合リセット**: モーダルを開くだけで、セッション状態と日次カウントの両方が適切にリセットされる

4. **フロントエンド自動検出**: 1分ごとの日付変更チェックにより、ユーザーがアプリを開いたままでも自動的にリセットが反映される

5. **SWRキャッシュ**: データの整合性を保つため、SWRによるキャッシュ管理と自動再検証を使用

6. **一元化されたリセット処理**: 複数のAPIで個別に日付チェックを行うのではなく、`POST /api/user/reset-daily-speak-count`で一元管理
