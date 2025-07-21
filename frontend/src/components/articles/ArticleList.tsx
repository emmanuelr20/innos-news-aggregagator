'use client';

import { useEffect, useRef, useCallback } from 'react';

import { Article } from '@/types';
import { ArticleCard } from './ArticleCard';
import { ArticleCardSkeleton } from './ArticleCardSkeleton';
import { HiExclamationCircle, HiDocumentText } from 'react-icons/hi';

interface ArticleListProps {
  articles: Article[];
  onLoadMore?: () => void;
  onSaveArticle?: (articleId: number) => void;
  onUnsaveArticle?: (articleId: number) => void;
  hasMore?: boolean;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  error?: string | null;
  emptyMessage?: string;
  showSaveButton?: boolean;
  showEndMessage?: boolean;
}

export function ArticleList({
  articles,
  onLoadMore,
  onSaveArticle,
  onUnsaveArticle,
  hasMore = false,
  isLoading = false,
  isLoadingMore = false,
  error = null,
  emptyMessage = "No articles found.",
  showSaveButton = true,
  showEndMessage = true,
}: ArticleListProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  // Intersection Observer for infinite scrolling - using a separate trigger element
  const setupIntersectionObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry?.isIntersecting && hasMore && onLoadMore && !isLoadingMore) {
        onLoadMore();
      }
    }, {
      // Use a small rootMargin to trigger slightly before the element is fully visible
      rootMargin: '30px',
      threshold: 0.1
    });

    if (triggerRef.current) {
      observerRef.current.observe(triggerRef.current);
    }
  }, [hasMore, onLoadMore, isLoadingMore]);

  useEffect(() => {
    setupIntersectionObserver();
  }, [setupIntersectionObserver]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Loading state
  if (isLoading && articles.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <ArticleCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Error state
  if (error && articles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <HiExclamationCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading articles</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!isLoading && articles.length === 0) {
    return (
      <div className="text-center py-12">
        <HiDocumentText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No articles</h3>
        <p className="mt-1 text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <div key={article.id}>
            <ArticleCard
              article={article}
              {...(onSaveArticle && { onSave: onSaveArticle })}
              {...(onUnsaveArticle && { onUnsave: onUnsaveArticle })}
              showSaveButton={showSaveButton}
            />
          </div>
        ))}
      </div>

      {/* Loading More Indicator */}
      {isLoadingMore && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <ArticleCardSkeleton key={`loading-${index}`} />
          ))}
        </div>
      )}

      {/* Infinite Scroll Trigger - Only visible when there are more items to load */}
      {hasMore && !isLoadingMore && (
        <div 
          ref={triggerRef}
          className="h-4 w-full"
          aria-hidden="true"
        />
      )}

      {/* Load More Button (fallback for infinite scroll) */}
      {hasMore && !isLoadingMore && onLoadMore && (
        <div className="text-center py-6">
          <button
            onClick={onLoadMore}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Load More Articles
          </button>
        </div>
      )}

      {/* End of Results */}
      {!hasMore && articles.length > 0 && showEndMessage && (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">
            You&apos;ve reached the end of the articles.
          </p>
        </div>
      )}
    </div>
  );
}