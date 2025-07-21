'use client';

import { useState, useEffect, useCallback } from 'react';

import { apiClient } from '@/lib/api-client';
import { Article, PaginatedResponse, ArticleParams } from '@/types';

interface UseArticlesOptions {
  initialParams?: ArticleParams;
  autoFetch?: boolean;
  infiniteScroll?: boolean;
}

interface UseArticlesReturn {
  articles: Article[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
  total: number;
  fetchArticles: (params?: ArticleParams) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  saveArticle: (articleId: number) => Promise<void>;
  unsaveArticle: (articleId: number) => Promise<void>;
}

export function useArticles(
  options: UseArticlesOptions = {}
): UseArticlesReturn {
  const {
    initialParams = {},
    autoFetch = true,
    infiniteScroll = false,
  } = options;

  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentParams, setCurrentParams] =
    useState<ArticleParams>(initialParams);

  const fetchArticles = useCallback(
    async (params: ArticleParams = {}) => {
      try {
        setIsLoading(true);
        setError(null);

        const mergedParams = { ...currentParams, ...params };
        setCurrentParams(mergedParams);

        const response: PaginatedResponse<Article> =
          await apiClient.articles.getArticles(mergedParams);

        if (infiniteScroll && mergedParams.page && mergedParams.page > 1) {
          // Append to existing articles for infinite scroll
          setArticles(prev => [...prev, ...response.items]);
        } else {
          // Replace articles for new search/filter
          setArticles(response.items);
        }

        setCurrentPage(response.current_page);
        setTotalPages(response.last_page);
        setTotal(response.total);
        setHasMore(response.current_page < response.last_page);
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to fetch articles'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [currentParams, infiniteScroll]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || isLoading) return;

    try {
      setIsLoadingMore(true);
      setError(null);

      const nextPage = currentPage + 1;
      const params = { ...currentParams, page: nextPage };

      const response: PaginatedResponse<Article> =
        await apiClient.articles.getArticles(params);

      setArticles(prev => [...prev, ...response.items]);
      setCurrentPage(response.current_page);
      setHasMore(response.current_page < response.last_page);
    } catch (err) {
      console.error('Error loading more articles:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load more articles'
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentParams, currentPage, hasMore, isLoadingMore, isLoading]);

  const refresh = useCallback(async () => {
    setCurrentPage(1);
    setArticles([]);
    await fetchArticles({ ...currentParams, page: 1 });
  }, [fetchArticles, currentParams]);

  const saveArticle = useCallback(async (articleId: number) => {
    try {
      await apiClient.articles.saveArticle(articleId);

      // Update the article in the local state
      setArticles(prev =>
        prev.map(article =>
          article.id === articleId ? { ...article, is_saved: true } : article
        )
      );
    } catch (err) {
      console.error('Error saving article:', err);
      throw err;
    }
  }, []);

  const unsaveArticle = useCallback(async (articleId: number) => {
    try {
      await apiClient.articles.unsaveArticle(articleId);

      // Update the article in the local state
      setArticles(prev =>
        prev.map(article =>
          article.id === articleId ? { ...article, is_saved: false } : article
        )
      );
    } catch (err) {
      console.error('Error unsaving article:', err);
      throw err;
    }
  }, []);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchArticles(initialParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]); // Only run on mount

  return {
    articles,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    currentPage,
    totalPages,
    total,
    fetchArticles,
    loadMore,
    refresh,
    saveArticle,
    unsaveArticle,
  };
}
