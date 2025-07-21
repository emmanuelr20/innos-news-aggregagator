export type TabType = 'personalized' | 'saved' | 'all';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs: { id: TabType; label: string; description: string }[] = [
    {
      id: 'personalized',
      label: 'Personalized Feed',
      description: 'Articles based on your preferences'
    },
    {
      id: 'saved',
      label: 'Saved Articles',
      description: 'Articles you\'ve saved for later'
    },
    {
      id: 'all',
      label: 'All Articles',
      description: 'All articles from all sources'
    }
  ];

  return (
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col items-center md:items-start">
                <span>{tab.label}</span>
                <span className="text-xs mt-1 hidden md:block">{tab.description}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>
  );
} 