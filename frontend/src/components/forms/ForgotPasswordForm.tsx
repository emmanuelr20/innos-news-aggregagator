'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/api-client';
import { useToast } from '@/contexts/ToastContext';
import { useFormValidation } from '@/hooks/useFormValidation';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

interface ForgotPasswordFormData {
  email: string;
  [key: string]: unknown;
}

export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  } = useFormValidation<ForgotPasswordFormData>(
    { email: '' },
    {
      email: {
        required: true,
        pattern: /\S+@\S+\.\S+/,
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

    setIsLoading(true);
    setError(null);

    try {
      await apiClient.auth.forgotPassword(values.email);
      showSuccess('Reset email sent!', 'Please check your email for password reset instructions.');
      onSuccess?.();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errors) {
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
          setError(error.message);
          showError('Failed to send reset email', error.message);
        }
      } else {
        const message = 'Failed to send reset email. Please try again.';
        setError(message);
        showError('Reset failed', message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4" role="alert">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

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
          placeholder="Enter your email address"
        />
        {getFieldError('email') && (
          <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
            {getFieldError('email')}
          </p>
        )}
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
              Sending reset link...
            </span>
          ) : (
            'Send reset email'
          )}
        </button>
      </div>
    </form>
  );
}