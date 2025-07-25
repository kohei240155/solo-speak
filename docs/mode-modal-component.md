# ModeModal コンポーネント

SpeakとQuizのモーダルに共通する機能を統一したモーダルコンポーネントです。設定項目を動的に変更でき、一貫したUIとUXを提供します。

## 特徴

- **統一されたUI**: SpeakとQuizで一貫したデザインとアニメーション
- **動的設定**: 設定項目を柔軟に変更可能
- **再利用可能**: 新しいモード追加時も簡単に対応
- **型安全**: TypeScriptで完全な型サポート
- **ローディング状態**: 内部・外部両方のローディング状態をサポート

## 基本的な使用例

```tsx
import ModeModal, { ModeModalConfig } from '@/components/ModeModal'

function MyModeModal() {
  const [myValue, setMyValue] = useState('option1')
  const [isLoading, setIsLoading] = useState(false)

  const handleStart = async (selectedLanguage: string) => {
    setIsLoading(true)
    try {
      // 開始処理
      console.log('Starting with:', { selectedLanguage, myValue })
    } finally {
      setIsLoading(false)
    }
  }

  const modalConfig: ModeModalConfig = {
    title: 'My Mode',
    configItems: [
      {
        id: 'my-setting',
        label: 'My Setting',
        type: 'select',
        value: myValue,
        options: [
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' }
        ],
        onChange: setMyValue
      }
    ],
    onStart: handleStart,
    startButtonText: 'Start My Mode'
  }

  return (
    <ModeModal
      isOpen={isOpen}
      onClose={onClose}
      config={modalConfig}
      languages={languages}
      defaultLearningLanguage={defaultLearningLanguage}
      isLoading={isLoading}
    />
  )
}
```

## Props

### 必須Props

- `isOpen: boolean` - モーダルの表示状態
- `onClose: () => void` - モーダルを閉じる関数
- `config: ModeModalConfig` - モーダルの設定
- `languages: Language[]` - 利用可能な言語の配列
- `defaultLearningLanguage: string` - デフォルトの学習言語

### オプションProps

- `isLoading?: boolean` - 外部ローディング状態（デフォルト: false）

## ModeModalConfig インターフェース

```tsx
interface ModeModalConfig {
  title: string
  configItems: ModalConfigItem[]
  onStart: (selectedLanguage: string) => Promise<void> | void
  startButtonText?: string
}
```

## ModalConfigItem インターフェース

```tsx
interface ModalConfigItem {
  id: string
  label: string
  type: 'select' | 'info'
  options?: { value: string; label: string }[]
  value?: string | number
  onChange?: (value: string) => void
  readonly?: boolean
}
```

## 設定項目タイプ

### select
選択式の設定項目です。

```tsx
{
  id: 'order',
  label: 'Order',
  type: 'select',
  value: order,
  options: [
    { value: 'new-to-old', label: 'NEW → OLD' },
    { value: 'old-to-new', label: 'OLD → NEW' }
  ],
  onChange: setOrder
}
```

### info
情報表示専用の設定項目です。

```tsx
{
  id: 'question-count',
  label: 'Question Count',
  type: 'info',
  value: `${questionCount} questions (max: ${availablePhraseCount})`
}
```

## 共通機能

### 言語選択
すべてのモーダルで共通して言語選択セクションが最初に表示されます。選択された言語は `onStart` コールバックの引数として渡されます。

### ローディング状態
内部ローディング（`onStart` 実行中）と外部ローディング（プロパティで指定）の両方をサポートし、どちらかがtrueの場合はローディング表示になります。

### スタートボタン
統一されたスタイルのスタートボタンが表示され、ローディング中は自動的に無効化されます。

## 実装済みモーダル

### SpeakModeModal
Speak練習用のモーダル。Order設定を含みます。

```tsx
const modalConfig: ModeModalConfig = {
  title: 'Speak Mode',
  configItems: [
    {
      id: 'order',
      label: 'Order',
      type: 'select',
      value: order,
      options: [
        { value: 'new-to-old', label: 'NEW → OLD' },
        { value: 'old-to-new', label: 'OLD → NEW' }
      ],
      onChange: setOrder
    }
  ],
  onStart: handleStart,
  startButtonText: 'Start'
}
```

### QuizModeModal
Quiz練習用のモーダル。Mode設定と問題数情報を含みます。

```tsx
const modalConfig: ModeModalConfig = {
  title: 'Quiz Mode',
  configItems: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      value: mode,
      options: [
        { value: 'normal', label: 'Normal' },
        { value: 'random', label: 'Random' }
      ],
      onChange: setMode
    },
    {
      id: 'question-count',
      label: 'Question Count',
      type: 'info',
      value: `${questionCount} questions (max: ${availablePhraseCount})`
    }
  ],
  onStart: handleStart,
  startButtonText: 'Start'
}
```

## メリット

1. **コードの重複排除**: 約200行のコードを削減
2. **統一されたUX**: 全てのモードモーダルで一貫したユーザーエクスペリエンス
3. **保守性向上**: 一箇所の修正で全てのモードモーダルに反映
4. **拡張性**: 新しいモードの追加が容易
5. **型安全性**: TypeScriptによる完全な型チェック

## 今後の拡張

新しいモード（例：Reading Mode、Listening Mode）を追加する場合も、同じ `ModeModal` コンポーネントを使用して簡単に実装できます。
