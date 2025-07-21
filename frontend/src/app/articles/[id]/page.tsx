'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { HiExclamationCircle, HiArrowLeft, HiExternalLink, HiShare, HiHeart } from 'react-icons/hi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

import { Article } from '@/types';
import { apiClient } from '@/lib/api-client';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder';

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState(false);

  const articleId = parseInt(params.id as string);

  const fetchArticle = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedArticle = await apiClient.articles.getArticle(articleId);
      setArticle(fetchedArticle);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load article');
    } finally {
      setIsLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    if (!articleId || isNaN(articleId)) {
      setError('Invalid article ID');
      setIsLoading(false);
      return;
    }

    fetchArticle();
  }, [articleId, fetchArticle]);

  const handleSaveToggle = async () => {
    if (!article || isSaving) return;
    
    setIsSaving(true);
    try {
      if (article.is_saved) {
        await apiClient.articles.unsaveArticle(article.id);
        setArticle({ ...article, is_saved: false });
      } else {
        await apiClient.articles.saveArticle(article.id);
        setArticle({ ...article, is_saved: true });
      }
    } catch {
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!article) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary || '',
          url: article.url,
        });
      } catch {
      }
    } else {
      try {
        await navigator.clipboard.writeText(article.url);
      } catch {
      }
    }
  };

  const handleReadOriginal = () => {
    if (article?.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <AiOutlineLoading3Quarters className="animate-spin h-8 w-8 text-blue-600" />
              <span className="text-lg text-gray-600">Loading article...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <HiExclamationCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Article not found</h3>
            <p className="mt-1 text-sm text-gray-500">{error || 'The article you are looking for does not exist.'}</p>
            <div className="mt-6">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const publishedDate = new Date(article.published_at);
  const timeAgo = formatDistanceToNow(publishedDate, { addSuffix: true });
  const formattedDate = format(publishedDate, 'MMMM d, yyyy \'at\' h:mm a');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <HiArrowLeft className="w-4 h-4 mr-2" />
            Back to articles
          </button>
        </div>

        <article className="bg-white rounded-lg shadow-sm overflow-hidden">
          <header className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="font-medium text-blue-600">{article.source.name}</span>
                <span>•</span>
                <span>{article.category.name}</span>
              </div>
              <time className="text-sm text-gray-500" dateTime={article.published_at} title={formattedDate}>
                {timeAgo}
              </time>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {article.title}
            </h1>

            {article.author && (
              <p className="text-gray-600 mb-4">
                By <span className="font-medium">{article.author}</span>
              </p>
            )}

            <div className="flex items-center space-x-4">
              <button
                onClick={handleReadOriginal}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
              >
                Read Original Article
                <HiExternalLink className="ml-2 w-4 h-4" />
              </button>

              <button
                onClick={handleShare}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <HiShare className="w-4 h-4 mr-2" />
                Share
              </button>

              <button
                onClick={handleSaveToggle}
                disabled={isSaving}
                className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
                  article.is_saved
                    ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100 focus:ring-red-500'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500'
                }`}
              >
                {isSaving ? (
                  <AiOutlineLoading3Quarters className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <HiHeart className={`w-4 h-4 mr-2 ${article.is_saved ? 'fill-current text-red-600' : 'stroke-current'}`} />
                )}
                {article.is_saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </header>

          {/* Article Image */}
          <div className="relative h-96 w-full mb-8 rounded-lg overflow-hidden">
            {article.image_url && !imageError ? (
              <Image
                src={article.image_url}
                alt={article.title}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
              />
            ) : (
              <ImagePlaceholder className="h-full w-full" type="article" />
            )}
          </div>

          <div className="p-6">
            {article.summary && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Summary</h2>
                <p className="text-gray-700 leading-relaxed">{article.summary}</p>
              </div>
            )}

            {article.content && (
              <div className="prose prose-lg max-w-none">
                <div 
                  className="text-gray-800 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
              </div>
            )}

            {!article.content && !article.summary && (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  Full content is not available. Click the button below to read the original article.
                </p>
                <button
                  onClick={handleReadOriginal}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Read Original Article
                  <HiExternalLink className="ml-2 w-5 h-5" />
                </button>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Published {timeAgo} by {article.source.name}
                </div>
                <Link
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
                >
                  View Original
                  <HiExternalLink className="ml-1 w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}