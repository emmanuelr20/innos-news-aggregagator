import { useEffect } from 'react';
import { ArticleList } from '@/components/articles/ArticleList';
import { FeedSearchAndSort } from '@/components/feed/FeedSearchAndSort';
import { useArticles } from '@/hooks/useArticles';
import { useFeedSearch } from '@/hooks/useFeedSearch';
import { ArticleParams } from '@/types';

interface NewsFeedProps {
  saved: boolean;
  title: string;
  subtitle: string;
}

export function NewsFeed({saved, title, subtitle}: NewsFeedProps) {
  // Use the reusable search and sort hook
  const {
    searchQuery,
    sortBy,
    sortOrder,
    handleSearch,
    handleClearSearch,
    handleSort,
    handleSortOrderChange,
  } = useFeedSearch({
    initialSortBy: 'published_at',
    initialSortOrder: 'desc',
  });

  const {
    articles,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    total,
    fetchArticles,
    loadMore,
    saveArticle,
    unsaveArticle,
  } = useArticles({
    initialParams: { 
      per_page: 12, 
      ...(saved && {saved}),
      sort_by: sortBy,
      sort_order: sortOrder,
    },
    autoFetch: true,
    infiniteScroll: true,
  });

  // Update articles when search or sort changes
  useEffect(() => {
    const params: ArticleParams = {
      sort_by: sortBy,
      sort_order: sortOrder,
      page: 1,
    };

    if (searchQuery.trim()) {
      params.search = searchQuery;
    } else {
      params.search = undefined;
    }
    
    fetchArticles(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortOrder, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Feed Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600">
            {subtitle}
            {total !== undefined && ` • ${total} article${total === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>

      {/* Search and Sort Controls */}
      <FeedSearchAndSort
        searchQuery={searchQuery}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        onSort={handleSort}
        onSortOrderChange={handleSortOrderChange}
        placeholder="Search your saved articles..."
        isLoading={isLoading}
        resultsCount={articles.length}
      />

      {/* Articles List */}
      <ArticleList
        articles={articles}
        hasMore={hasMore}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        error={error}
        onLoadMore={loadMore}
        onSaveArticle={saveArticle}
        onUnsaveArticle={unsaveArticle}
        showSaveButton
        showEndMessage
        emptyMessage={
          searchQuery.trim() 
            ? "No articles match your search. Try different keywords or clear the search to see all articles."
            : `No articles yet. ${saved ? "Start saving articles from your feed to read them later!" : "Start reading articles from your feed!"}`
        }
      />
    </div>
  );
} 