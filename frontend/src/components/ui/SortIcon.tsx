import { SortField, SortOrder } from '@/utils/sort';
import { HiSwitchVertical, HiSortDescending, HiSortAscending } from 'react-icons/hi';

interface SortIconProps {
  sortType: SortField;
  currentSort: SortField;
  sortOrder: SortOrder;
}

export function SortIcon({ sortType, currentSort, sortOrder }: SortIconProps) {
  if (currentSort !== sortType) {
    return <HiSwitchVertical className="w-4 h-4 ml-1 text-gray-400" />;
  }
  
  return sortOrder === 'desc' ? (
    <HiSortDescending className="w-4 h-4 ml-1" />
  ) : (
    <HiSortAscending className="w-4 h-4 ml-1" />
  );
} 