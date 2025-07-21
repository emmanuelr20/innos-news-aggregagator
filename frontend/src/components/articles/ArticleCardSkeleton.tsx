export function ArticleCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      {/* Image Skeleton - matches new structure */}
      <div className="relative h-48 w-full">
        <div className="h-full w-full bg-gray-200" />
      </div>
      
      <div className="p-4">
        {/* Source and Date Skeleton */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="h-4 bg-gray-200 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded w-1" />
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>

        {/* Title Skeleton */}
        <div className="space-y-2 mb-3">
          <div className="h-5 bg-gray-200 rounded w-full" />
          <div className="h-5 bg-gray-200 rounded w-3/4" />
        </div>

        {/* Summary Skeleton */}
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>

        {/* Author Skeleton */}
        <div className="h-4 bg-gray-200 rounded w-24 mb-3" />

        {/* Actions Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gray-200 rounded-full" />
            <div className="h-8 w-8 bg-gray-200 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}