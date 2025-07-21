import { useState, useCallback } from 'react';
import { SortField, SortOrder, handleSortToggle } from '@/utils/sort';

interface UseFeedSearchOptions {
  initialSortBy?: SortField;
  initialSortOrder?: SortOrder;
  onSearchChange?: (query: string) => void;
  onSortChange?: (sortBy: SortField, sortOrder: SortOrder) => void;
}

export function useFeedSearch({
  initialSortBy = 'published_at',
  initialSortOrder = 'desc',
  onSearchChange,
  onSortChange,
}: UseFeedSearchOptions = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    onSearchChange?.(query);
  }, [onSearchChange]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    onSearchChange?.('');
  }, [onSearchChange]);

  const handleSort = useCallback((newSortBy: SortField) => {
    const { sortBy: newSort, sortOrder: newOrder } = handleSortToggle(sortBy, newSortBy, sortOrder);
    setSortBy(newSort);
    setSortOrder(newOrder);
    onSortChange?.(newSort, newOrder);
  }, [sortBy, sortOrder, onSortChange]);

  const handleSortOrderChange = useCallback((newOrder: SortOrder) => {
    setSortOrder(newOrder);
    onSortChange?.(sortBy, newOrder);
  }, [sortBy, onSortChange]);

  return {
    searchQuery,
    sortBy,
    sortOrder,
    handleSearch,
    handleClearSearch,
    handleSort,
    handleSortOrderChange,
  };
} 