# コンポーネント一覧

## ディレクトリ構造

```
src/components/
├── auth/           # 認証関連
├── common/         # 汎用コンポーネント
├── layout/         # レイアウト・ランディングページ
├── modals/         # モーダル
├── navigation/     # ナビゲーション
├── phrase/         # フレーズ関連
├── quiz/           # クイズ
├── settings/       # 設定
├── speak/          # スピーキング
└── speech/         # スピーチ関連
```

---

## 汎用コンポーネント (common/)

### BaseModal

**ファイル**: `src/components/common/BaseModal.tsx`

すべてのモーダルの基底コンポーネント。react-modalをラップ。

```typescript
import BaseModal from "@/components/common/BaseModal";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  width?: string;              // デフォルト: "500px"
  showCloseButton?: boolean;   // デフォルト: true
  closeOnOverlayClick?: boolean; // デフォルト: true
  titleButton?: {
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
  };
}

// 使用例
<BaseModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="モーダルタイトル"
  width="600px"
>
  <p>モーダルの内容</p>
  <button onClick={() => setIsModalOpen(false)}>閉じる</button>
</BaseModal>
```

---

### LoadingSpinner

**ファイル**: `src/components/common/LoadingSpinner.tsx`

ローディング表示。

```typescript
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";   // デフォルト: "md"
  message?: string;
  className?: string;
  fullScreen?: boolean;        // デフォルト: false
  withHeaderOffset?: boolean;  // デフォルト: false
  minHeight?: string;
}

// 使用例
<LoadingSpinner size="lg" message="読み込み中..." />

// フルスクリーン
<LoadingSpinner fullScreen />

// ヘッダーオフセット付き
<LoadingSpinner withHeaderOffset />
```

---

### LanguageSelector

**ファイル**: `src/components/common/LanguageSelector.tsx`

言語選択ドロップダウン。

```typescript
import LanguageSelector from "@/components/common/LanguageSelector";

<LanguageSelector
  value={selectedLanguage}
  onChange={(code) => setSelectedLanguage(code)}
  languages={languages}  // Language[]
  label="学習言語"
/>
```

---

### DropdownMenu

**ファイル**: `src/components/common/DropdownMenu.tsx`

ドロップダウンメニュー（編集・削除等のアクション用）。

```typescript
import DropdownMenu from "@/components/common/DropdownMenu";

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}

interface DropdownMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  items: DropdownMenuItem[];
  triggerIcon?: React.ComponentType<{ className?: string }>;
  customTrigger?: React.ReactNode;
  triggerSize?: "sm" | "md" | "lg";          // デフォルト: "md"
  position?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  width?: string;
  zIndex?: number;
  triggerClassName?: string;
  menuClassName?: string;
  fontSize?: "sm" | "base" | "lg";
  itemHeight?: "sm" | "base" | "lg";
}

// 使用例
const [isOpen, setIsOpen] = useState(false);

<DropdownMenu
  isOpen={isOpen}
  onToggle={() => setIsOpen(!isOpen)}
  onClose={() => setIsOpen(false)}
  items={[
    { id: "edit", label: "編集", onClick: () => handleEdit() },
    { id: "delete", label: "削除", onClick: () => handleDelete(), variant: "danger" },
  ]}
  position="bottom-right"
/>
```

---

### ImageUpload

**ファイル**: `src/components/common/ImageUpload.tsx`

画像アップロード・クロップコンポーネント。react-image-cropを使用。

```typescript
import ImageUpload, { ImageUploadRef } from "@/components/common/ImageUpload";

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  onImageRemove?: () => void;
  disabled?: boolean;
}

export interface ImageUploadRef {
  getImageFile: () => File | null;
}

// 使用例
const imageUploadRef = useRef<ImageUploadRef>(null);

<ImageUpload
  ref={imageUploadRef}
  currentImage={user.iconUrl}
  onImageChange={(url) => setPreviewUrl(url)}
  onImageRemove={() => setPreviewUrl(null)}
/>

// ref経由でFileを取得（フォーム送信時など）
const file = imageUploadRef.current?.getImageFile();
```

---

## 認証コンポーネント (auth/)

### LoginModal

**ファイル**: `src/components/auth/LoginModal.tsx`

Googleログイン用モーダル。

```typescript
import LoginModal from "@/components/auth/LoginModal";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 使用例
<LoginModal
  isOpen={showLoginModal}
  onClose={() => setShowLoginModal(false)}
/>
```

---

### BrowserSwitchHelpModal

**ファイル**: `src/components/auth/BrowserSwitchHelpModal.tsx`

ブラウザ切り替え方法のヘルプモーダル。

```typescript
import BrowserSwitchHelpModal from "@/components/auth/BrowserSwitchHelpModal";

interface BrowserSwitchHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 使用例
<BrowserSwitchHelpModal
  isOpen={showHelpModal}
  onClose={() => setShowHelpModal(false)}
/>
```

---

### AuthApiConnection

**ファイル**: `src/components/auth/AuthApiConnection.tsx`

AuthContextとAPIクライアントを接続するコンポーネント。propsなし。

```typescript
import AuthApiConnection from "@/components/auth/AuthApiConnection";

// アプリルートで使用
<AuthApiConnection />
```

---

## モーダルコンポーネント (modals/)

### 主要モーダル一覧

| コンポーネント | ファイル | 用途 |
|---------------|----------|------|
| `ModeModal` | `src/components/modals/ModeModal.tsx` | モード選択 |
| `QuizModeModal` | `src/components/modals/QuizModeModal.tsx` | クイズモード選択 |
| `SpeakModeModal` | `src/components/modals/SpeakModeModal.tsx` | スピーキングモード選択 |
| `SpeechStatusModal` | `src/components/modals/SpeechStatusModal.tsx` | スピーチステータス選択 |
| `WithdrawalModal` | `src/components/modals/WithdrawalModal.tsx` | 退会確認 |
| `AddToHomeScreenModal` | `src/components/modals/AddToHomeScreenModal.tsx` | PWAインストール案内 |

### モーダル作成テンプレート

```typescript
"use client";

import BaseModal from "@/components/common/BaseModal";
import { useTranslation } from "@/hooks/ui/useTranslation";

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function CustomModal({ isOpen, onClose, onConfirm }: CustomModalProps) {
  const { t } = useTranslation();

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={t("modal.title")}>
      <p className="text-gray-600 mb-4">{t("modal.description")}</p>

      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
        >
          {t("common.cancel")}
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {t("common.confirm")}
        </button>
      </div>
    </BaseModal>
  );
}
```

---

## フレーズコンポーネント (phrase/)

### PhraseList

**ファイル**: `src/components/phrase/PhraseList.tsx`

フレーズ一覧表示（無限スクロール対応）。編集・削除・説明表示・スピーキング練習への遷移機能。

```typescript
import PhraseList from "@/components/phrase/PhraseList";

interface PhraseListProps {
  isModalContext?: boolean;
  nativeLanguage?: string;
  learningLanguage?: string;
  targetUserId?: string | null;
  savedPhrases?: PhraseData[];
  isLoadingPhrases?: boolean;
  isLoadingMore?: boolean;
  languages?: LanguageInfo[];
  onRefreshPhrases?: () => void;
  onUpdatePhrase?: (phrase: PhraseData) => void;
}

// 使用例（スタンドアロン）
<PhraseList />

// 使用例（外部から状態を渡す）
<PhraseList
  savedPhrases={phrases}
  isLoadingPhrases={isLoading}
  isLoadingMore={isLoadingMore}
  learningLanguage="en"
  onRefreshPhrases={refreshPhrases}
/>
```

---

### PhraseItem

**ファイル**: `src/components/phrase/PhraseItem.tsx`

フレーズリストの各アイテム。フレーズレベル（正解数による色分け）、日付、統計情報を表示。

```typescript
import PhraseItem from "@/components/phrase/PhraseItem";

interface PhraseItemProps {
  phrase: SavedPhrase;
  isMenuOpen: boolean;
  onMenuToggle: (phraseId: string) => void;
  onEdit: (phrase: SavedPhrase) => void;
  onSpeak: (phraseId: string) => void;
  onDelete: (phraseId: string) => void;
  onExplanation: (phrase: SavedPhrase) => void;
}

// 使用例
<PhraseItem
  phrase={phrase}
  isMenuOpen={openMenuId === phrase.id}
  onMenuToggle={(id) => setOpenMenuId(id)}
  onEdit={(p) => openEditModal(p)}
  onSpeak={(id) => navigateToSpeak(id)}
  onDelete={(id) => handleDelete(id)}
  onExplanation={(p) => openExplanationModal(p)}
/>
```

---

### GeneratedVariations

**ファイル**: `src/components/phrase/GeneratedVariations.tsx`

AI生成の3スタイル翻訳表示・編集。200文字制限とニュアンス説明を表示。

```typescript
import GeneratedVariations from "@/components/phrase/GeneratedVariations";

interface GeneratedVariationsProps {
  generatedVariations: PhraseVariation[];
  editingVariations: { [key: number]: string };
  isSaving: boolean;
  savingVariationIndex: number | null;
  desiredPhrase: string;
  onEditVariation: (index: number, newText: string) => void;
  onSelectVariation: (variation: PhraseVariation, index: number) => void;
  error: string;
}

// 使用例
<GeneratedVariations
  generatedVariations={[
    { style: "general", translation: "Hello", explanation: "一般的な挨拶" },
    { style: "polite", translation: "Good day", explanation: "丁寧な挨拶" },
    { style: "casual", translation: "Hey", explanation: "カジュアルな挨拶" },
  ]}
  editingVariations={editingVariations}
  isSaving={isSaving}
  savingVariationIndex={savingVariationIndex}
  desiredPhrase="こんにちは"
  onEditVariation={(index, text) => handleEditVariation(index, text)}
  onSelectVariation={(v, i) => handleSelectVariation(v, i)}
  error={error}
/>
```

---

### RandomGeneratedVariations

**ファイル**: `src/components/phrase/RandomGeneratedVariations.tsx`

ランダム生成されたフレーズの表示・保存。AIが生成した1つのランダムフレーズを表示し、保存機能を提供。

```typescript
import RandomGeneratedVariations from "@/components/phrase/RandomGeneratedVariations";

interface RandomGeneratedVariationsProps {
  randomGeneratedVariations: PhraseVariation[];
  isRandomSaving: boolean;
  error: string;
  onSave: () => void;
}

// 使用例
<RandomGeneratedVariations
  randomGeneratedVariations={[
    {
      original: "I've been meaning to tell you...",
      translation: "ずっと言おうと思ってたんだけど...",
      explanation: "「ずっと〜しようと思っていた」という意図を伝える表現。"
    }
  ]}
  isRandomSaving={isSaving}
  error={error}
  onSave={() => handleSaveRandomPhrase()}
/>
```

---

## スピーチコンポーネント (speech/)

### SpeechList

**ファイル**: `src/components/speech/SpeechList.tsx`

スピーチ一覧表示。編集・削除機能とレビューページへの遷移を提供。

```typescript
import SpeechList from "@/components/speech/SpeechList";

interface SpeechListProps {
  speeches?: SpeechListItem[];
  isLoadingSpeeches?: boolean;
  isLoadingMore?: boolean;
  learningLanguage?: string;
  onRefreshSpeeches?: () => void;
}

// 使用例
<SpeechList
  speeches={speeches}
  isLoadingSpeeches={isLoading}
  isLoadingMore={isLoadingMore}
  learningLanguage="en"
  onRefreshSpeeches={refreshSpeeches}
/>
```

---

### SpeechResult

**ファイル**: `src/components/speech/SpeechResult.tsx`

スピーチ結果表示・編集。タイトル、スピーチプラン、音声再生、AI提案文、フィードバック、メモ機能。

```typescript
import SpeechResult from "@/components/speech/SpeechResult";

interface SpeechResultProps {
  title: string;
  speechPlan: string[];
  yourSpeech: string;
  sentences: SentenceData[];
  feedback: FeedbackData[];
  audioBlob?: Blob | null;
  note?: string;
  onNoteChange?: (note: string) => void;
  onSave?: () => void | Promise<void>;
  isSaving?: boolean;
  onHasUnsavedChanges?: (hasChanges: boolean) => void;
}

// 使用例
<SpeechResult
  title="My Speech"
  speechPlan={["Point 1", "Point 2"]}
  yourSpeech="This is my speech..."
  sentences={sentences}
  feedback={feedbacks}
  audioBlob={audioBlob}
  note={note}
  onNoteChange={setNote}
  onSave={handleSave}
  isSaving={isSaving}
/>
```

---

## クイズコンポーネント (quiz/)

### QuizPractice

**ファイル**: `src/components/quiz/QuizPractice.tsx`

クイズ練習画面。フレーズ翻訳表示、Got It/No Ideaボタン、音読回数カウント機能。

```typescript
import QuizPractice from "@/components/quiz/QuizPractice";

interface QuizPracticeProps {
  session: QuizSession;
  currentPhrase: QuizPhrase;
  showTranslation: boolean;
  onShowTranslation: () => void;
  onHideTranslation: () => void;
  onAnswer: (isCorrect: boolean) => void;
  onNext: () => void;
  onFinish: () => void;
  onSpeakCount?: (phraseId: string, count: number) => void;
  onPendingCountChange?: (count: number) => void;
}

// 使用例
<QuizPractice
  session={quizSession}
  currentPhrase={currentPhrase}
  showTranslation={showTranslation}
  onShowTranslation={() => setShowTranslation(true)}
  onHideTranslation={() => setShowTranslation(false)}
  onAnswer={(isCorrect) => handleAnswer(isCorrect)}
  onNext={handleNext}
  onFinish={handleFinish}
  onSpeakCount={(id, count) => updateSpeakCount(id, count)}
/>
```

---

## スピーキングコンポーネント (speak/)

### SpeakPractice

**ファイル**: `src/components/speak/SpeakPractice.tsx`

スピーキング練習画面。フレーズ表示、Countボタン、Soundボタン、Nextボタン。

```typescript
import SpeakPractice from "@/components/speak/SpeakPractice";

interface SpeakPhrase {
  id: string;
  original: string;
  translation: string;
  totalSpeakCount: number;
  dailySpeakCount: number;
  explanation?: string;
}

interface SpeakPracticeProps {
  phrase: SpeakPhrase | null;
  onCount: () => void;
  onNext: () => void;
  onFinish: () => void;
  todayCount: number;
  totalCount: number;
  isLoading?: boolean;
  isNextLoading?: boolean;
  isHideNext?: boolean;
  isFinishing?: boolean;
  isCountDisabled?: boolean;
  learningLanguage?: string;
  onExplanation?: () => void;
}

// 使用例
<SpeakPractice
  phrase={currentPhrase}
  onCount={handleCount}
  onNext={handleNext}
  onFinish={handleFinish}
  todayCount={todayCount}
  totalCount={totalCount}
  isLoading={isLoading}
  isNextLoading={isNextLoading}
  learningLanguage="en"
  onExplanation={() => setShowExplanation(true)}
/>
```

---

## 設定コンポーネント (settings/)

### UserSettingsForm

**ファイル**: `src/components/settings/UserSettingsForm.tsx`

ユーザー設定フォーム。プロフィール画像、表示名、母国語、学習言語、メールアドレス、脱退機能。

```typescript
import UserSettingsForm from "@/components/settings/UserSettingsForm";

interface UserSettingsFormProps {
  register: UseFormRegister<UserSetupFormData>;
  errors: FieldErrors<UserSetupFormData>;
  setValue: UseFormSetValue<UserSetupFormData>;
  watch: UseFormWatch<UserSetupFormData>;
  handleSubmit: UseFormHandleSubmit<UserSetupFormData>;
  languages: Language[];
  dataLoading: boolean;
  setError: (error: string) => void;
  setIsUserSetupComplete: (complete: boolean) => void;
  onSubmit?: (data: UserSetupFormData) => void;
  submitting: boolean;
}

// 使用例（react-hook-formと連携）
const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<UserSetupFormData>();

<UserSettingsForm
  register={register}
  errors={errors}
  setValue={setValue}
  watch={watch}
  handleSubmit={handleSubmit}
  languages={languages}
  dataLoading={isLoading}
  setError={setError}
  setIsUserSetupComplete={setIsComplete}
  onSubmit={handleFormSubmit}
  submitting={isSubmitting}
/>
```

---

### SubscriptionTab

**ファイル**: `src/components/settings/SubscriptionTab.tsx`

サブスクリプション管理画面。現在のステータス、請求日、プランの表示と管理機能。propsなし。

```typescript
import SubscriptionTab from "@/components/settings/SubscriptionTab";

// 使用例
<SubscriptionTab />
```

---

## ナビゲーションコンポーネント (navigation/)

### PhraseTabNavigation

**ファイル**: `src/components/navigation/PhraseTabNavigation.tsx`

フレーズページのタブナビゲーション（生成、リスト、クイズ、スピーキング）。

```typescript
import PhraseTabNavigation from "@/components/navigation/PhraseTabNavigation";

<PhraseTabNavigation activeTab="list" />
```

---

### SpeechTabNavigation

**ファイル**: `src/components/navigation/SpeechTabNavigation.tsx`

スピーチページのタブナビゲーション（追加、リスト、レビュー）。

```typescript
import SpeechTabNavigation from "@/components/navigation/SpeechTabNavigation";

<SpeechTabNavigation activeTab="add" />
```

---

## コンポーネント作成テンプレート

### 基本テンプレート

**ファイル**: `src/components/[feature]/[Component].tsx`

```typescript
"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "@/hooks/ui/useTranslation";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface ComponentProps {
  data: DataType;
  onAction: (id: string) => void;
  isLoading?: boolean;
}

export default function Component({ data, onAction, isLoading = false }: ComponentProps) {
  const { t } = useTranslation();
  const [localState, setLocalState] = useState<string>("");

  const handleClick = useCallback(() => {
    onAction(data.id);
  }, [data.id, onAction]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold">{data.title}</h3>
      <p className="text-gray-600">{data.description}</p>
      <button
        onClick={handleClick}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {t("common.action")}
      </button>
    </div>
  );
}
```

---

## よく使うインポート

```typescript
// コンポーネント
import BaseModal from "@/components/common/BaseModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import LanguageSelector from "@/components/common/LanguageSelector";
import DropdownMenu from "@/components/common/DropdownMenu";

// フック
import { useTranslation } from "@/hooks/ui/useTranslation";
import { useTextToSpeech } from "@/hooks/ui/useTextToSpeech";
import { useAuth } from "@/contexts/AuthContext";

// アイコン
import { MdClose, MdEdit, MdDelete, MdPlayArrow } from "react-icons/md";
```

---

## 関連フック

| フック | ファイル | 用途 |
|--------|----------|------|
| `useTranslation` | `src/hooks/ui/useTranslation.ts` | i18n翻訳 |
| `useTextToSpeech` | `src/hooks/ui/useTextToSpeech.ts` | TTS再生 |
| `useModalManager` | `src/hooks/ui/useModalManager.ts` | モーダル状態管理 |
| `usePhraseList` | `src/hooks/phrase/usePhraseList.ts` | フレーズ一覧 |
| `useSpeechList` | `src/hooks/speech/useSpeechList.ts` | スピーチ一覧 |

---

## スタイリング

Tailwind CSSを使用。レスポンシブ対応。

```tsx
// レスポンシブ例
<div className="p-4 sm:p-6 md:p-8">
  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">タイトル</h1>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* アイテム */}
  </div>
</div>
```
