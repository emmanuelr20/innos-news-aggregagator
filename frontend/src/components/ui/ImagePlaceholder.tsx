import { HiNewspaper, HiPhotograph } from 'react-icons/hi';

interface ImagePlaceholderProps {
  className?: string;
  type?: 'article' | 'photo';
}

export function ImagePlaceholder({ 
  className = '', 
  type = 'article' 
}: ImagePlaceholderProps) {
  const Icon = type === 'article' ? HiNewspaper : HiPhotograph;
  
  return (
    <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
      <div className="text-center">
        <Icon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
        <p className="text-xs text-gray-500">No image available</p>
      </div>
    </div>
  );
} 