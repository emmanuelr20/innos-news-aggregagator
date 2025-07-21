'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SearchBar } from '@/components/search/SearchBar';
import { SortIcon } from '@/components/ui/SortIcon';
import { SortField, SortOrder, getSortLabel } from '@/utils/sort';
import { HiAdjustments } from 'react-icons/hi';

interface FeedSearchAndSortProps {
  searchQuery: string;
  sortBy: SortField;
  sortOrder: SortOrder;
  onSearch: (query: string) => void;
  onClearSearch: () => void;
  onSort: (sortBy: SortField) => void;
  onSortOrderChange: (order: SortOrder) => void;
  placeholder?: string;
  isLoading?: boolean;
  resultsCount?: number;
  context?: 'saved' | 'personalized';
  extraActions?: React.ReactNode;
}

export function FeedSearchAndSort({
  searchQuery,
  sortBy,
  sortOrder,
  onSearch,
  onClearSearch,
  onSort,
  onSortOrderChange,
  placeholder = "Search...",
  isLoading = false,
  resultsCount,
  context = 'personalized',
  extraActions,
}: FeedSearchAndSortProps) {
  return (
    <div className="space-y-4">
      {/* Search and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="max-w-md flex-1">
          <SearchBar
            onSearch={onSearch}
            placeholder={placeholder}
            isLoading={isLoading}
          />
          {searchQuery && (
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {resultsCount} result{resultsCount === 1 ? '' : 's'} for "{searchQuery}"
              </p>
              <button
                onClick={onClearSearch}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
        
        {extraActions && (
          <div className="flex items-center space-x-3">
            {extraActions}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Sort by:</span>

        <Button
          variant={sortBy === 'published_at' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSort('published_at')}
          className="flex items-center"
        >
          {getSortLabel('published_at', context)}
          <SortIcon sortType="published_at" currentSort={sortBy} sortOrder={sortOrder} />
        </Button>
        
        <Button
          variant={sortBy === 'created_at' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSort('created_at')}
          className="flex items-center"
        >
          {getSortLabel('created_at', context)}
          <SortIcon sortType="created_at" currentSort={sortBy} sortOrder={sortOrder} />
        </Button>

        <Button
          variant={sortBy === 'title' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSort('title')}
          className="flex items-center"
        >
          {getSortLabel('title', context)}
          <SortIcon sortType="title" currentSort={sortBy} sortOrder={sortOrder} />
        </Button>


        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center">
              <HiAdjustments className="w-4 h-4 mr-1" />
              Options
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSortOrderChange('desc')} className="flex items-center justify-between">
              Descending
              {sortOrder === 'desc' && <Badge variant="secondary" className="ml-2">Active</Badge>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortOrderChange('asc')} className="flex items-center justify-between">
              Ascending
              {sortOrder === 'asc' && <Badge variant="secondary" className="ml-2">Active</Badge>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Current Sort Status */}
        <Badge variant="outline" className="ml-2">
          {getSortLabel(sortBy, context)} • {sortOrder === 'desc' ? 'Descending' : 'Ascending'}
        </Badge>
      </div>
    </div>
  );
} 