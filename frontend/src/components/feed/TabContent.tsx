import { PersonalizedFeed } from '@/components/feed/PersonalizedFeed';
import { ArticleList } from '@/components/articles/ArticleList';
import { useArticles } from '@/hooks/useArticles';
import { TabType } from './TabNavigation';
import { SavedFeed } from './SavedFeed';
import { NewsFeed } from './NewsFeed';

interface TabContentProps {
  activeTab: TabType;
}

export function TabContent({ activeTab }: TabContentProps) {

  if (activeTab === 'personalized') {
    return (
      <PersonalizedFeed />
    );
  }

  if (activeTab === 'saved') {
    return (
      <SavedFeed />
    );
  }

  if (activeTab === 'all') {
    return (
      <NewsFeed saved={false} title="All Articles" subtitle="All articles from all sources" />
    );
  }

  return null;
} 