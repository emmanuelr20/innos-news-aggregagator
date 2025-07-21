'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { HiShare, HiHeart } from 'react-icons/hi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

import { Article } from '@/types';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder';

interface ArticleCardProps {
  article: Article;
  onSave?: (articleId: number) => void;
  onUnsave?: (articleId: number) => void;
  isLoading?: boolean;
  showSaveButton?: boolean;
}

export function ArticleCard({
  article,
  onSave,
  onUnsave,
  isLoading = false,
  showSaveButton = true,
}: ArticleCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveToggle = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      if (article.is_saved) {
        await onUnsave?.(article.id);
      } else {
        await onSave?.(article.id);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary || '',
          url: article.url,
        });
      } catch {
        // User cancelled sharing or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(article.url);
        // You might want to show a toast notification here
      } catch {
        // Failed to copy to clipboard
      }
    }
  };

  const publishedDate = new Date(article.published_at);
  const timeAgo = formatDistanceToNow(publishedDate, { addSuffix: true });

  return (
    <article className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Article Image */}
      <div className="relative h-48 w-full">
        {article.image_url && !imageError ? (
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <ImagePlaceholder className="h-full w-full" type="article" />
        )}
      </div>

      <div className="p-4">
        {/* Source and Category */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium text-blue-600">{article.source.name}</span>
            <span>•</span>
            <span>{article.category.name}</span>
          </div>
          <time className="text-sm text-gray-500" dateTime={article.published_at}>
            {timeAgo}
          </time>
        </div>

        {/* Title */}
        <Link href={`/articles/${article.id}`}>
          <h2 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200 line-clamp-2 mb-2">
            {article.title}
          </h2>
        </Link>

        {/* Summary */}
        {article.summary && (
          <p className="text-gray-700 text-sm line-clamp-3 mb-3">
            {article.summary}
          </p>
        )}

        {/* Author */}
        {article.author && (
          <p className="text-sm text-gray-600 mb-3">
            By {article.author}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link
            href={`/articles/${article.id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
          >
            Read more →
          </Link>

          <div className="flex items-center space-x-2">
            {/* Share Button */}
            <button
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200"
              title="Share article"
            >
              <HiShare className="w-4 h-4" />
            </button>

            {/* Save Button */}
            {showSaveButton && (
              <button
                onClick={handleSaveToggle}
                disabled={isSaving || isLoading}
                className={`p-2 rounded-full transition-colors duration-200 ${
                  article.is_saved
                    ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                    : 'text-gray-200 hover:text-gray-700 hover:bg-gray-100'
                } ${(isSaving || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={article.is_saved ? 'Remove from saved' : 'Save article'}
              >
                {isSaving ? (
                  <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
                ) : (
                  <HiHeart className={`w-4 h-4 ${article.is_saved ? 'fill-current' : ''}`} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}