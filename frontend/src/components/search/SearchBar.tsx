'use client';

import { useState, useRef } from 'react';
import { HiSearch, HiX, HiArrowRight } from 'react-icons/hi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  className?: string;
}

export function SearchBar({
  onSearch,
  placeholder = "Search articles...",
  isLoading = false,
  className = "",
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isLoading ? (
              <AiOutlineLoading3Quarters className="animate-spin h-5 w-5 text-gray-400" />
            ) : (
              <HiSearch className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="absolute inset-y-0 right-0 flex items-center">
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <HiX className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="p-2 mr-1 text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <HiArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}