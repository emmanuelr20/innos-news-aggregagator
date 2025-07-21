'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { useFormValidation } from '@/hooks/useFormValidation';
import { ApiError } from '@/lib/api-client';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

interface LoginFormProps {
  onSuccess?: () => void;
}

interface LoginFormData {
  email: string;
  password: string;
  [key: string]: unknown;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, isLoading, error, clearError } = useAuth();
  const { showSuccess, showError } = useToast();

  const {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    validateForm,
    setFormErrors,
    getFieldProps,
    getFieldError,
  } = useFormValidation<LoginFormData>(
    { email: '', password: '' },
    {
      email: {
        required: true,
        pattern: /\S+@\S+\.\S+/,
      },
      password: {
        required: true,
      },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setFormErrors(formErrors);
      return;
    }

    clearError();

    try {
      await login(values.email, values.password);
      showSuccess('Welcome back!', 'You have been successfully signed in.');
      onSuccess?.();
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        setFormErrors(
          Object.entries(error.errors).reduce(
            (acc, [key, messages]) => ({
              ...acc,
              [key]: messages[0],
            }),
            {},
          ),
        );
      } else {
        showError('Sign in failed', 'Please check your credentials and try again.');
      }
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4" role="alert">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address <span className="text-red-500" aria-label="required">*</span>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            {...getFieldProps('email')}
            className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
              getFieldError('email') ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors`}
            placeholder="Enter your email"
          />
          {getFieldError('email') && (
            <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
              {getFieldError('email')}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password <span className="text-red-500" aria-label="required">*</span>
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            {...getFieldProps('password')}
            className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
              getFieldError('password') ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors`}
            placeholder="Enter your password"
          />
          {getFieldError('password') && (
            <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
              {getFieldError('password')}
            </p>
          )}
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading || !isValid}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-describedby={isLoading ? 'loading-message' : undefined}
        >
          {isLoading ? (
            <span className="flex items-center">
              <AiOutlineLoading3Quarters className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </button>
      </div>
    </form>
  );
}