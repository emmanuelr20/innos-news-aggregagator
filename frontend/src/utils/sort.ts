export type SortField = 'created_at' | 'published_at' | 'title';
export type SortOrder = 'asc' | 'desc';

export const getSortLabel = (sortType: SortField, context: 'saved' | 'personalized' = 'personalized') => {
  switch (sortType) {
    case 'created_at': 
      return context === 'saved' ? 'Saved Date' : 'Date Added';
    case 'published_at': 
      return 'Published Date';
    case 'title': 
      return 'Title';
    default: 
      return '';
  }
};

export const handleSortToggle = (
  currentSort: SortField, 
  newSort: SortField, 
  currentOrder: SortOrder
): { sortBy: SortField; sortOrder: SortOrder } => {
  if (currentSort === newSort) {
    return { 
      sortBy: currentSort, 
      sortOrder: currentOrder === 'desc' ? 'asc' : 'desc' 
    };
  } else {
    return { 
      sortBy: newSort, 
      sortOrder: 'desc' 
    };
  }
}; 