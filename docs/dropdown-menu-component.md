# DropdownMenu コンポーネント

再利用可能なドロップダウンメニューコンポーネントです。三点リーダーボタンをクリックすることで表示されるメニューをサポートします。

## 特徴

- **再利用可能**: 他のコンポーネントから簡単に使用できます
- **カスタマイズ可能**: アイコン、位置、スタイルを柔軟に設定できます
- **アクセシビリティ**: キーボード操作（ESCキー）とスクリーンリーダーに対応
- **型安全**: TypeScriptで型安全な実装
- **自動閉じ**: メニュー外クリックで自動的に閉じます

## 基本的な使用例

```tsx
import DropdownMenu from '@/components/DropdownMenu'
import { BsPencil } from 'react-icons/bs'
import { RiDeleteBin6Line } from 'react-icons/ri'

function MyComponent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <DropdownMenu
      isOpen={isMenuOpen}
      onToggle={() => setIsMenuOpen(!isMenuOpen)}
      onClose={() => setIsMenuOpen(false)}
      items={[
        {
          id: 'edit',
          label: 'Edit',
          icon: BsPencil,
          onClick: handleEdit
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: RiDeleteBin6Line,
          onClick: handleDelete,
          variant: 'danger'
        }
      ]}
    />
  )
}
```

## Props

### 必須Props

- `isOpen: boolean` - メニューの表示状態
- `onToggle: () => void` - メニューの開閉を切り替える関数
- `onClose: () => void` - メニューを閉じる関数
- `items: DropdownMenuItem[]` - メニューアイテムの配列

### オプションProps

- `triggerIcon?: React.ComponentType` - トリガーボタンのアイコン（デフォルト: 三点リーダー）
- `customTrigger?: React.ReactNode` - カスタムトリガー要素（triggerIconよりも優先されます）
- `triggerSize?: 'sm' | 'md' | 'lg'` - トリガーボタンのサイズ（デフォルト: 'md'）
- `position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'` - メニューの表示位置（デフォルト: 'bottom-right'）
- `width?: string` - メニューの幅（デフォルト: 'w-28'）
- `zIndex?: number` - メニューのz-index（デフォルト: 10）
- `triggerClassName?: string` - トリガーボタンの追加クラス
- `menuClassName?: string` - メニューコンテナの追加クラス

## DropdownMenuItem インターフェース

```tsx
interface DropdownMenuItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}
```

## バリアント

### danger
赤色のテキストで表示され、削除などの危険なアクションに使用します。

```tsx
{
  id: 'delete',
  label: 'Delete',
  icon: RiDeleteBin6Line,
  onClick: handleDelete,
  variant: 'danger'
}
```

### disabled
非活性状態で表示され、クリックできなくなります。

```tsx
{
  id: 'action',
  label: 'Disabled Action',
  onClick: handleAction,
  disabled: true
}
```

## カスタムトリガーの使用

ユーザーアバターなど、アイコン以外の要素をトリガーとして使用する場合：

```tsx
<DropdownMenu
  customTrigger={
    <Image
      src={userAvatar}
      alt="User Avatar"
      className="w-9 h-9 rounded-full"
    />
  }
  triggerClassName="p-1 rounded-full hover:bg-gray-100"
  // ... other props
/>
```

## カスタムアイコンの使用

```tsx
import { AiOutlineMore } from 'react-icons/ai'

<DropdownMenu
  triggerIcon={AiOutlineMore}
  // ... other props
/>
```

## 位置の調整

```tsx
<DropdownMenu
  position="top-left"
  width="w-32"
  // ... other props
/>
```

## 実装箇所

現在、以下のコンポーネントで使用されています：

- `PhraseList.tsx` - フレーズアイテムの編集・削除・スピーク機能
- `Header.tsx` - ユーザードロップダウンメニュー（デスクトップ・モバイル）

## メリット

1. **コードの重複排除**: 同じドロップダウンロジックを複数箇所で再利用
2. **一貫したUI**: 全てのドロップダウンメニューで統一されたスタイル
3. **保守性向上**: 一箇所の修正で全てのドロップダウンメニューに反映
4. **テストしやすさ**: 単一コンポーネントとして独立してテストが可能
