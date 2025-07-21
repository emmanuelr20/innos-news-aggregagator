'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArticleList } from '@/components/articles/ArticleList';
import { FeedSearchAndSort } from '@/components/feed/FeedSearchAndSort';
import { PreferencesModal } from '@/components/preferences/PreferencesModal';
import { useArticles } from '@/hooks/useArticles';
import { useFeedSearch } from '@/hooks/useFeedSearch';
import { useAuth } from '@/contexts/AppContext';
import { apiClient } from '@/lib/api-client';
import { ArticleParams, UserPreferences } from '@/types';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { HiExclamationCircle, HiCog, HiRefresh } from 'react-icons/hi';

interface PersonalizedFeedProps {
  className?: string;
}

const transformUserPreferencesToFeedParams = (preferences: UserPreferences | null ) => {
  if (!preferences) return {};

  return {
    source_ids: preferences.preferred_sources,
    category_ids: preferences.preferred_categories,
    authors: preferences.preferred_authors,
  };
};

export function PersonalizedFeed({ className = "" }: PersonalizedFeedProps) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);

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
    refresh,
    saveArticle,
    unsaveArticle,
  } = useArticles({
    initialParams: {
      ...transformUserPreferencesToFeedParams(preferences),
      sort_by: sortBy,
      sort_order: sortOrder,
      per_page: 6,
    },
    autoFetch: false,
    infiniteScroll: true,
  });

  // Load user preferences
  useEffect(() => {
    if (!user) {
      setIsLoadingPreferences(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        setIsLoadingPreferences(true);
        setPreferencesError(null);
        const userPreferences = await apiClient.preferences.getPreferences();
        setPreferences(userPreferences);
      } catch (err) {
        console.error('Error loading preferences:', err);
        setPreferencesError(err instanceof Error ? err.message : 'Failed to load preferences');
      } finally {
        setIsLoadingPreferences(false);
      }
    };

    loadPreferences();
  }, [user]);

  // Refresh articles when preferences, search, or sort options change
  useEffect(() => {
    if (!isLoadingPreferences && preferences && hasPreferences()) {
      console.log(preferences);
      const params: ArticleParams = {
        ...transformUserPreferencesToFeedParams(preferences),
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery;
      } else {
        params.search = undefined;
      }
      
      fetchArticles(params);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences, sortBy, sortOrder, searchQuery, isLoadingPreferences]);

  // Handle preferences save from modal
  const handlePreferencesSave = useCallback((updatedPreferences: UserPreferences) => {
    setPreferences(updatedPreferences);
    // Refresh the feed with new preferences
    refresh();
  }, [refresh]);

  const hasPreferences = () => {
    return preferences && (
      (preferences.preferred_sources && preferences.preferred_sources.length > 0) ||
      (preferences.preferred_categories && preferences.preferred_categories.length > 0) ||
      (preferences.preferred_authors && preferences.preferred_authors.length > 0)
    );
  };

  const getPreferenceSummary = () => {
    if (!preferences) return '';
    
    const parts = [];
    
    if (preferences.preferred_sources && preferences.preferred_sources.length > 0) {
      parts.push(`${preferences.preferred_sources.length} source${preferences.preferred_sources.length === 1 ? '' : 's'}`);
    }
    
    if (preferences.preferred_categories && preferences.preferred_categories.length > 0) {
      parts.push(`${preferences.preferred_categories.length} categor${preferences.preferred_categories.length === 1 ? 'y' : 'ies'}`);
    }
    
    if (preferences.preferred_authors && preferences.preferred_authors.length > 0) {
      parts.push(`${preferences.preferred_authors.length} author${preferences.preferred_authors.length === 1 ? '' : 's'}`);
    }
    
    return parts.join(', ');
  };

  // Loading preferences
  if (isLoadingPreferences) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="flex items-center space-x-2">
          <AiOutlineLoading3Quarters className="animate-spin h-5 w-5 text-blue-600" />
          <span className="text-gray-600">Loading your personalized feed...</span>
        </div>
      </div>
    );
  }

  // Preferences error
  if (preferencesError) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <HiExclamationCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading preferences</h3>
        <p className="mt-1 text-sm text-gray-500">{preferencesError}</p>
        <div className="mt-6">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No preferences set
  if (!hasPreferences()) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <HiCog className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Set up your preferences</h3>
        <p className="mt-1 text-sm text-gray-500">
          Customize your news feed by selecting your preferred sources, categories, and topics.
        </p>
        <div className="mt-6">
          <button
            onClick={() => setIsPreferencesModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Set Preferences
          </button>
        </div>
        
        <PreferencesModal
          isOpen={isPreferencesModalOpen}
          onClose={() => setIsPreferencesModalOpen(false)}
          onSave={handlePreferencesSave}
        />
      </div>
    );
  }

  const extraActions = (
    <>
      <Button
        onClick={() => refresh()}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="flex items-center"
      >
        <HiRefresh className="h-4 w-4 mr-2" />
        Refresh
      </Button>
      <Button
        onClick={() => setIsPreferencesModalOpen(true)}
        variant="default"
        size="sm"
        className="flex items-center"
      >
        <HiCog className="h-4 w-4 mr-2" />
        Edit Preferences
      </Button>
    </>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Feed Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Personalized Feed</h2>
        <p className="text-gray-600">
          Based on your preferences: {getPreferenceSummary()}
          {total !== undefined && ` • ${total} article${total === 1 ? '' : 's'} found`}
        </p>
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
        placeholder="Search your personalized feed..."
        isLoading={isLoading}
        resultsCount={articles.length}
        context="personalized"
        extraActions={extraActions}
      />

      {/* Articles */}
      <ArticleList
        articles={articles}
        {...(!searchQuery && { onLoadMore: loadMore, hasMore })} // Only add these props when not searching
        onSaveArticle={saveArticle}
        onUnsaveArticle={unsaveArticle}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        error={error}
        emptyMessage={
          searchQuery
            ? `No articles match "${searchQuery}" in your personalized feed.`
            : "No articles found matching your preferences. Try updating your preferences to see more content."
        }
        showSaveButton
      />

      {/* Preferences Modal */}
      <PreferencesModal
        isOpen={isPreferencesModalOpen}
        onClose={() => setIsPreferencesModalOpen(false)}
        onSave={handlePreferencesSave}
      />
    </div>
  );
}