import { TabType } from '@/types/phrase'

interface PhraseTabNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export default function PhraseTabNavigation({ activeTab, onTabChange }: PhraseTabNavigationProps) {
  const tabs: { key: TabType; label: string }[] = [
    { key: 'List', label: 'List' },
    { key: 'Add', label: 'Add' },
    { key: 'Speak', label: 'Speak' },
    { key: 'Quiz', label: 'Quiz' }
  ]

  return (
    <div className="flex mb-[18px]">
      {tabs.map((tab, index) => (
        <button 
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex-1 py-2 text-sm md:text-base border border-gray-300 ${
            index === 0 ? 'rounded-l-[20px]' : ''
          } ${
            index === tabs.length - 1 ? 'rounded-r-[20px]' : ''
          } ${
            index > 0 ? 'border-l-0' : ''
          } ${
            activeTab === tab.key ? 'bg-gray-200 text-gray-700 font-bold' : 'bg-white text-gray-700 font-normal'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
