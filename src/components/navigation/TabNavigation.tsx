interface TabNavigationProps {
  activeTab: 'user' | 'subscription'
  setActiveTab: (tab: 'user' | 'subscription') => void
  isUserSetupComplete: boolean
}

export default function TabNavigation({ 
  activeTab, 
  setActiveTab, 
  isUserSetupComplete 
}: TabNavigationProps) {
  return (
    <div className="flex mb-[18px]">
      <button 
        onClick={() => setActiveTab('user')}
        className={`flex-1 py-2 text-sm md:text-base rounded-l-[20px] ${
          activeTab === 'user' 
            ? 'bg-gray-200 text-gray-700 font-bold' 
            : 'bg-white text-gray-700 border border-gray-300 font-normal'
        }`}
      >
        User
      </button>
      <button 
        onClick={() => {
          // ユーザー設定が完了していない場合はSubscriptionタブに切り替えできない
          if (!isUserSetupComplete) return
          setActiveTab('subscription')
        }}
        className={`flex-1 py-2 text-sm md:text-base rounded-r-[20px] ${
          activeTab === 'subscription' 
            ? 'bg-gray-200 text-gray-700 font-bold' 
            : 'bg-white text-gray-700 border border-l-0 border-gray-300 font-normal'
        }`}
        disabled={!isUserSetupComplete}
      >
        Subscription
      </button>
    </div>
  )
}
