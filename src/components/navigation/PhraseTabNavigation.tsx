import { TabType } from '@/types/phrase'
import { useRouter } from 'next/navigation'

interface PhraseTabNavigationProps {
  activeTab: TabType
  onTabChange?: (tab: TabType) => void // Optional for backward compatibility
  checkUnsavedChanges?: () => boolean // Optional function to check for unsaved changes
  onSpeakModalOpen?: () => void // Speak modal open handler
  onQuizModalOpen?: () => void // Quiz modal open handler
}

export default function PhraseTabNavigation({ activeTab, onTabChange, checkUnsavedChanges, onSpeakModalOpen, onQuizModalOpen }: PhraseTabNavigationProps) {
  const router = useRouter()

  const tabs: { key: TabType; label: string; path: string }[] = [
    { key: 'List', label: 'List', path: '/phrase/list' },
    { key: 'Add', label: 'Add', path: '/phrase/add' },
    { key: 'Speak', label: 'Speak', path: '/phrase/speak' },
    { key: 'Quiz', label: 'Quiz', path: '/phrase/quiz' }
  ]

  const handleTabClick = (tab: { key: TabType; label: string; path: string }) => {
    // アクティブなタブがクリックされた場合は何もしない
    if (activeTab === tab.key) {
      return
    }

    // 未保存の変更チェック（AddタブまたはSpeakタブから離脱する場合）
    if ((activeTab === 'Add' || activeTab === 'Speak') && tab.key !== activeTab && checkUnsavedChanges) {
      if (checkUnsavedChanges()) {
        const message = activeTab === 'Add' 
          ? '生成されたフレーズが保存されていません。このページを離れますか？'
          : 'Countが登録されていません。このページを離れますか？'
        const confirmLeave = window.confirm(message)
        if (!confirmLeave) {
          return // ユーザーがキャンセルした場合は何もしない
        }
      }
    }

    // Speakタブの場合は常にモーダルを表示（ページ遷移はしない）
    if (tab.key === 'Speak') {
      if (onSpeakModalOpen) {
        onSpeakModalOpen()
      }
      // onSpeakModalOpenがない場合でも、ページ遷移はしない
      // モーダルが必須なので、何もしない
      return
    }

    // Quizタブの場合は常にモーダルを表示（ページ遷移はしない）
    if (tab.key === 'Quiz') {
      if (onQuizModalOpen) {
        onQuizModalOpen()
      }
      // onQuizModalOpenがない場合でも、ページ遷移はしない
      // モーダルが必須なので、何もしない
      return
    }

    // カスタムのonTabChangeがある場合は優先（backward compatibility）
    if (onTabChange) {
      onTabChange(tab.key)
    } else {
      // ルーターナビゲーション
      router.push(tab.path)
    }
  }

  return (
    <div className="flex mb-[18px]" data-tab-navigation>
      {tabs.map((tab, index) => (
        <button 
          key={tab.key}
          onClick={() => handleTabClick(tab)}
          className={`flex-1 py-2 text-sm md:text-base border border-gray-300 ${
            index === 0 ? 'rounded-l-[20px]' : ''
          } ${
            index === tabs.length - 1 ? 'rounded-r-[20px]' : ''
          } ${
            index > 0 ? 'border-l-0' : ''
          } ${
            activeTab === tab.key 
              ? 'bg-gray-200 text-gray-700 font-bold cursor-default' 
              : 'bg-white text-gray-700 font-normal cursor-pointer hover:bg-gray-50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
