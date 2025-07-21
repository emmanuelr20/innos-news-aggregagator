'use client';

import { useEffect, useState } from 'react';
import { HiCheckCircle, HiXCircle, HiExclamationCircle, HiInformationCircle, HiX } from 'react-icons/hi';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export function Toast({ 
  id, 
  type, 
  title, 
  message, 
  duration = 5000, 
  onClose 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Allow fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <HiCheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <HiXCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <HiExclamationCircle className="h-5 w-5 text-yellow-400" />;
      case 'info':
        return <HiInformationCircle className="h-5 w-5 text-blue-400" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
    }
  };

  return (
    <div
      className={`
        ${getBackgroundColor()} 
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        transition-all duration-300 ease-in-out
        max-w-sm w-full border rounded-lg shadow-lg pointer-events-auto
      `}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-medium ${getTextColor()}`}>
              {title}
            </p>
            {message && (
              <p className={`mt-1 text-sm ${getTextColor()}`}>
                {message}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className={`
                inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2
                ${type === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' : ''}
                ${type === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-600' : ''}
                ${type === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600' : ''}
                ${type === 'info' ? 'text-blue-500 hover:bg-blue-100 focus:ring-blue-600' : ''}
              `}
              onClick={handleClose}
              aria-label="Close notification"
            >
              <HiX className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}