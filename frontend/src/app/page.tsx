'use client';

import Link from 'next/link';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { HiNewspaper, HiSearch, HiHeart } from 'react-icons/hi';

import { ArticleList } from '@/components/articles/ArticleList';
import { Navigation } from '@/components/layout/Navigation';
import { useAuth } from '@/contexts/AppContext';
import { useArticles } from '@/hooks/useArticles';

export default function Home() {
  const { isLoading } = useAuth();

  const {
    articles: latestArticles,
    isLoading: isLoadingLatest,
    isLoadingMore: isLoadingMoreLatest,
    error: latestError,
  } = useArticles({
    initialParams: { per_page: 6 },
    autoFetch: true,
  });


  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center space-x-2">
          <AiOutlineLoading3Quarters className="h-5 w-5 animate-spin text-primary" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            News Aggregator
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-gray-500 sm:text-lg md:mt-5 md:max-w-3xl md:text-xl">
            Stay informed with personalized news from multiple sources. Get the
            latest articles, search for specific topics, and save articles for
            later reading.
          </p>
        </div>

        <div className="space-y-12">
          {/* Guest Actions */}
          <div className="text-center">
            <div className="flex justify-center space-x-4">
              <Link
                href="/register"
                className="inline-flex items-center rounded-md border border-transparent bg-primary px-6 py-3 text-base font-medium text-white transition-colors duration-200 hover:bg-blue-700"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Latest Articles for Guests */}
          <div>
            <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
              Latest News
            </h2>
            <ArticleList
              articles={latestArticles || []}
              hasMore={false}
              isLoading={isLoadingLatest}
              isLoadingMore={isLoadingMoreLatest}
              error={latestError}
              showSaveButton={false}
              showEndMessage={false}
              emptyMessage="No articles available at the moment."
            />
          </div>

          {/* Features section */}
          <div className="mt-20">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
              Why Choose News Aggregator?
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary/60 text-white">
                  <HiNewspaper className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Multiple Sources
                </h3>
                <p className="mt-2 text-base text-gray-500">
                  Get news from trusted sources like The Guardian, New York
                  Times, and more.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary/60 text-white">
                  <HiSearch className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Smart Search
                </h3>
                <p className="mt-2 text-base text-gray-500">
                  Find articles by keywords, filter by source, category
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary/60 text-white">
                  <HiHeart className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Save for Later
                </h3>
                <p className="mt-2 text-base text-gray-500">
                  Bookmark articles to read later and organize your reading
                  list.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
