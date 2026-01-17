# ER図（Entity Relationship Diagram）

Prismaスキーマに基づいた完全なデータベース構造図です。

---

## テーブル定義

### マスターテーブル

```
┌────────────────────────────────────┐
│            Language                │
├────────────────────────────────────┤
│ id              string    PK       │
│ name            string             │
│ code            string    UK       │
│ createdAt       datetime           │
│ updatedAt       datetime           │
│ deletedAt       datetime?          │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│           PhraseLevel              │
├────────────────────────────────────┤
│ id              string    PK       │
│ name            string             │
│ score           int                │
│ color           string?            │
│ createdAt       datetime           │
│ updatedAt       datetime           │
│ deletedAt       datetime?          │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│          SpeechStatus              │
├────────────────────────────────────┤
│ id              string    PK       │
│ name            string             │
│ createdAt       datetime           │
│ updatedAt       datetime           │
│ deletedAt       datetime?          │
└────────────────────────────────────┘
```

### ユーザー関連

```
┌──────────────────────────────────────────────────┐
│                      User                        │
├──────────────────────────────────────────────────┤
│ id                          string      PK       │
│ email                       string      UK       │
│ username                    string?              │
│ iconUrl                     string?              │
│ nativeLanguageId            string?     FK ──────┼──► Language
│ defaultLearningLanguageId   string?     FK ──────┼──► Language
│ stripeCustomerId            string?              │
│ remainingPhraseGenerations  int                  │
│ lastPhraseGenerationDate    datetime?            │
│ lastDailySpeakCountResetDate datetime?           │
│ remainingSpeechCount        int                  │
│ lastSpeechCountResetDate    datetime?            │
│ timezone                    string?              │
│ createdAt                   datetime             │
│ updatedAt                   datetime             │
│ deletedAt                   datetime?            │
└──────────────────────────────────────────────────┘
         │
         │ 1:n
         ▼
┌────────────────────────────────────┐
│           Situation                │
├────────────────────────────────────┤
│ id              string    PK       │
│ userId          string    FK ──────┼──► User
│ name            string             │
│ createdAt       datetime           │
│ updatedAt       datetime           │
│ deletedAt       datetime?          │
└────────────────────────────────────┘
```

### フレーズ関連

```
┌──────────────────────────────────────────────────┐
│                     Phrase                       │
├──────────────────────────────────────────────────┤
│ id                  string      PK               │
│ userId              string      FK ──────────────┼──► User
│ languageId          string      FK ──────────────┼──► Language
│ original            string                       │
│ translation         string                       │
│ explanation         string?                      │
│ totalSpeakCount     int                          │
│ dailySpeakCount     int                          │
│ lastSpeakDate       datetime?                    │
│ lastQuizDate        datetime?                    │
│ sessionSpoken       boolean                      │
│ correctQuizCount    int                          │
│ incorrectQuizCount  int                          │
│ phraseLevelId       string      FK ──────────────┼──► PhraseLevel
│ speechId            string?     FK ──────────────┼──► Speech (任意)
│ speechOrder         int?                         │
│ createdAt           datetime                     │
│ updatedAt           datetime                     │
│ deletedAt           datetime?                    │
└──────────────────────────────────────────────────┘
         │
         │ 1:n
         ├─────────────────────────┐
         ▼                         ▼
┌────────────────────────┐  ┌────────────────────────┐
│      QuizResult        │  │       SpeakLog         │
├────────────────────────┤  ├────────────────────────┤
│ id        string  PK   │  │ id        string  PK   │
│ phraseId  string  FK ──┼► │ phraseId  string  FK ──┼► Phrase
│ date      datetime     │  │ date      datetime     │
│ correct   boolean      │  │ count     int          │
│ createdAt datetime     │  │ createdAt datetime     │
│ updatedAt datetime     │  │ updatedAt datetime     │
│ deletedAt datetime?    │  │ deletedAt datetime?    │
└────────────────────────┘  └────────────────────────┘
```

### スピーチ関連

```
┌──────────────────────────────────────────────────┐
│                     Speech                       │
├──────────────────────────────────────────────────┤
│ id                  string      PK               │
│ userId              string      FK ──────────────┼──► User
│ title               string                       │
│ learningLanguageId  string      FK ──────────────┼──► Language
│ nativeLanguageId    string      FK ──────────────┼──► Language
│ statusId            string      FK ──────────────┼──► SpeechStatus
│ firstSpeechText     string                       │
│ audioFilePath       string?                      │
│ notes               string?                      │
│ practiceCount       int                          │
│ lastPracticedAt     datetime?                    │
│ createdAt           datetime                     │
│ updatedAt           datetime                     │
│ deletedAt           datetime?                    │
└──────────────────────────────────────────────────┘
         │
         │ 1:n
         ├─────────────────────────┐
         ▼                         ▼
┌────────────────────────────┐  ┌────────────────────────────┐
│      SpeechFeedback        │  │        SpeechPlan          │
├────────────────────────────┤  ├────────────────────────────┤
│ id         string     PK   │  │ id              string  PK │
│ speechId   string     FK ──┼► │ speechId        string  FK ┼► Speech
│ category   string          │  │ planningContent string     │
│ content    string          │  │ createdAt       datetime   │
│ createdAt  datetime        │  │ updatedAt       datetime   │
│ updatedAt  datetime        │  │ deletedAt       datetime?  │
│ deletedAt  datetime?       │  └────────────────────────────┘
└────────────────────────────┘
```

---

## リレーション一覧

```
User (1) ──────────► (n) Phrase
User (1) ──────────► (n) Speech
User (1) ──────────► (n) Situation
User (n) ◄──────────► (1) Language [nativeLanguage]
User (n) ◄──────────► (1) Language [defaultLearningLanguage]

Phrase (n) ◄────────► (1) User
Phrase (n) ◄────────► (1) Language
Phrase (n) ◄────────► (1) PhraseLevel
Phrase (n) ◄────────► (0..1) Speech [任意]
Phrase (1) ─────────► (n) QuizResult
Phrase (1) ─────────► (n) SpeakLog

Speech (n) ◄────────► (1) User
Speech (n) ◄────────► (1) Language [learningLanguage]
Speech (n) ◄────────► (1) Language [nativeLanguage]
Speech (n) ◄────────► (1) SpeechStatus
Speech (1) ─────────► (n) SpeechFeedback
Speech (1) ─────────► (n) SpeechPlan
Speech (1) ─────────► (n) Phrase
```

---

## 凡例

| 記号 | 意味 |
|------|------|
| `PK` | Primary Key（主キー） |
| `FK` | Foreign Key（外部キー） |
| `UK` | Unique Key（ユニークキー） |
| `?` | Nullable（NULL許容） |
| `►` | 参照先 |
| `1:n` | 1対多のリレーション |
| `0..1` | 0または1（任意の関係） |

---

## マスターデータの値

### Language（13言語）

| 言語名 | コード | TTS言語コード |
|--------|--------|---------------|
| English | en | en-US |
| Japanese | ja | ja-JP |
| Chinese | zh | zh-CN |
| Korean | ko | ko-KR |
| Spanish | es | es-ES |
| French | fr | fr-FR |
| German | de | de-DE |
| Italian | it | it-IT |
| Portuguese | pt | pt-PT |
| Hindi | hi | hi-IN |
| Thai | th | th-TH |
| Dutch | nl | nl-NL |
| Danish | da | da-DK |

**定義ファイル**: `src/constants/languages.ts`

### PhraseLevel（7段階）

| レベル | スコア | 色コード |
|--------|--------|----------|
| Lv1 | 0 | #D9D9D9 |
| Lv2 | 1 | #BFBFBF |
| Lv3 | 3 | #A6A6A6 |
| Lv4 | 6 | #8C8C8C |
| Lv5 | 10 | #737373 |
| Lv6 | 15 | #595959 |
| Lv7 | 21 | #404040 |

**定義ファイル**: `prisma/seed.ts`

### SpeechStatus（4段階）

| ステータス | 説明 |
|------------|------|
| A | 最高評価 |
| B | 良好 |
| C | 普通 |
| D | 要改善 |

**定義ファイル**: `prisma/seed.ts`

---

## テーブル物理名マッピング

| モデル名 | テーブル名 |
|----------|------------|
| User | users |
| Language | languages |
| PhraseLevel | phrase_levels |
| Phrase | phrases |
| QuizResult | quiz_results |
| SpeakLog | speak_logs |
| Situation | situations |
| Speech | speeches |
| SpeechFeedback | speech_feedbacks |
| SpeechPlan | speech_plans |
| SpeechStatus | speech_statuses |
