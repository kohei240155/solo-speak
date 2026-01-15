# Solo Speak 用語集

このドキュメントはプロジェクト全体で使用する用語を定義します。
新機能の設計時、このドキュメントの用語を使用し、新しい用語が必要な場合は追加してください。

## ドメイン用語

### フレーズ関連

| 用語 | 定義 | 英語表記 | コード上の表現 |
|------|------|----------|----------------|
| フレーズ | 学習対象となる文章単位 | Phrase | `phrase` |
| バリエーション | フレーズの複数表現（一般/丁寧/カジュアル） | Variations | `variations` |
| 母語 | ユーザーの母語 | Native Language | `nativeLanguage`, `nativeLanguageId` |
| 学習言語 | 学習対象の言語 | Learning Language | `learningLanguage`, `defaultLearningLanguageId` |
| シチュエーション | フレーズが使われる場面 | Situation | `situation` |

### 学習関連

| 用語 | 定義 | 英語表記 | コード上の表現 |
|------|------|----------|----------------|
| スピーキング練習 | 音声認識を使った発音練習 | Speaking Practice | `speakingPractice` |
| クイズモード | 理解度確認のための問題形式 | Quiz Mode | `quiz` |
| ランキング | ユーザーのスコアに基づく順位 | Ranking | `ranking` |
| ポイント | 学習アクティビティで獲得する点数 | Points | `points` |
| セッション音読フラグ | 当該セッションで音読済みかのフラグ | Session Spoken | `sessionSpoken` |
| 1日の音読回数 | その日の音読回数カウント | Daily Speak Count | `dailySpeakCount` |
| 累計音読回数 | 全期間の音読回数 | Total Speak Count | `totalSpeakCount` |
| クイズ正解数 | 正解したクイズの累計 | Correct Quiz Count | `correctQuizCount` |

### ユーザー関連

| 用語 | 定義 | 英語表記 | コード上の表現 |
|------|------|----------|----------------|
| プロフィール | ユーザーの基本情報 | Profile | `profile` |
| サブスクリプション | 有料プランの契約状態 | Subscription | `subscription` |
| クレジット | AI機能使用のための消費単位 | Credits | `credits` |

### 音声関連

| 用語 | 定義 | 英語表記 | コード上の表現 |
|------|------|----------|----------------|
| TTS | テキストを音声に変換する機能 | Text-to-Speech | `tts` |
| 音声認識 | 発話をテキストに変換する機能 | Speech Recognition | `speechRecognition` |
| 音声波形 | 音声の視覚的表現 | Audio Waveform | `waveform` |
| スピーチフィードバック | AIによる発話内容のフィードバック | Speech Feedback | `speechFeedback` |

## 技術用語

### プロジェクト固有

| 用語 | 定義 | 参照 |
|------|------|------|
| authenticateRequest | JWT認証を行うヘルパー関数。全APIルートで必須 | `@/utils/api-helpers.ts` |
| Prismaクライアント | DB操作クライアント。カスタム出力先を使用 | `@/utils/prisma.ts` |
| 論理削除 | `deletedAt`カラムによる削除フラグ管理 | - |
| トランザクション | 複数DB操作の原子性を保証する仕組み | `prisma.$transaction()` |

### レイヤー用語

| 用語 | 定義 | ディレクトリ |
|------|------|-------------|
| APIルート | Next.js App RouterのAPIエンドポイント | `src/app/api/` |
| コンポーネント | 再利用可能なUIパーツ | `src/components/` |
| フック | カスタムReact Hooks | `src/hooks/` |
| ユーティリティ | 共通ヘルパー関数群 | `src/utils/` |
| 型定義 | TypeScript型・インターフェース | `src/types/` |

## 略語一覧

| 略語 | 正式名称 | 説明 |
|------|----------|------|
| API | Application Programming Interface | - |
| DB | Database | - |
| UI | User Interface | - |
| UX | User Experience | - |
| TTS | Text-to-Speech | テキスト読み上げ |
| JWT | JSON Web Token | 認証トークン形式 |
| ORM | Object-Relational Mapping | Prisma |
| CRUD | Create, Read, Update, Delete | 基本操作 |

## 対応言語コード

| 言語 | コード | 表示名 |
|------|--------|--------|
| 日本語 | `ja` | Japanese |
| 英語 | `en` | English |
| 中国語（簡体） | `zh` | Chinese (Simplified) |
| 韓国語 | `ko` | Korean |
| スペイン語 | `es` | Spanish |
| フランス語 | `fr` | French |
| ドイツ語 | `de` | German |
| イタリア語 | `it` | Italian |
| ポルトガル語 | `pt` | Portuguese |
| ヒンディー語 | `hi` | Hindi |
| タイ語 | `th` | Thai |
| オランダ語 | `nl` | Dutch |
| デンマーク語 | `da` | Danish |

---

## 用語追加ガイドライン

1. **新しい用語を追加する場合**:
   - 既存の用語で代替できないか検討
   - 日本語・英語表記の両方を定義
   - コード上の表現（変数名等）を明記
   - 該当するカテゴリに追加

2. **既存用語と衝突する場合**:
   - 既存定義を優先
   - 変更が必要な場合はチームで合意を取る

3. **略語を使用する場合**:
   - 略語一覧に登録されているものを使用
   - 新しい略語は追加時に正式名称を明記
