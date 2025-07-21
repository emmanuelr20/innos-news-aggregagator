'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient, ApiError } from '@/lib/api-client';
import { useToast } from '@/contexts/ToastContext';
import { useFormValidation } from '@/hooks/useFormValidation';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

interface ResetPasswordFormProps {
  token: string;
  email: string;
  onSuccess?: () => void;
}

interface ResetPasswordFormData {
  password: string;
  password_confirmation: string;
  [key: string]: unknown;
}

export function ResetPasswordForm({
  token,
  email,
  onSuccess,
}: ResetPasswordFormProps) {
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
  } = useFormValidation<ResetPasswordFormData>(
    { password: '', password_confirmation: '' },
    {
      password: {
        required: true,
        minLength: 8,
      },
      password_confirmation: {
        required: true,
        match: 'password',
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
      await apiClient.auth.resetPassword(
        token,
        email,
        values.password,
        values.password_confirmation
      );
      showSuccess(
        'Password reset successful!',
        'Your password has been updated. You can now sign in with your new password.'
      );
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
              {}
            )
          );
        } else {
          setError(error.message);
          showError('Password reset failed', error.message);
        }
      } else {
        const message = 'Failed to reset password. Please try again.';
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
        <div
          className="rounded-md border border-red-200 bg-red-50 p-4"
          role="alert"
        >
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            New password{' '}
            <span className="text-red-500" aria-label="required">
              *
            </span>
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            {...getFieldProps('password')}
            className={`relative mt-1 block w-full appearance-none border px-3 py-2 ${
              getFieldError('password')
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            } rounded-md text-gray-900 placeholder-gray-500 transition-colors focus:z-10 focus:outline-none focus:ring-2 sm:text-sm`}
            placeholder="Enter your new password (min. 8 characters)"
          />
          {getFieldError('password') && (
            <p
              id="password-error"
              className="mt-1 text-sm text-red-600"
              role="alert"
            >
              {getFieldError('password')}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password_confirmation"
            className="block text-sm font-medium text-gray-700"
          >
            Confirm new password{' '}
            <span className="text-red-500" aria-label="required">
              *
            </span>
          </label>
          <input
            id="password_confirmation"
            type="password"
            autoComplete="new-password"
            required
            {...getFieldProps('password_confirmation')}
            className={`relative mt-1 block w-full appearance-none border px-3 py-2 ${
              getFieldError('password_confirmation')
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            } rounded-md text-gray-900 placeholder-gray-500 transition-colors focus:z-10 focus:outline-none focus:ring-2 sm:text-sm`}
            placeholder="Confirm your new password"
          />
          {getFieldError('password_confirmation') && (
            <p
              id="password-confirmation-error"
              className="mt-1 text-sm text-red-600"
              role="alert"
            >
              {getFieldError('password_confirmation')}
            </p>
          )}
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading || !isValid}
          className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-describedby={isLoading ? 'loading-message' : undefined}
        >
          {isLoading ? (
            <span className="flex items-center">
              <AiOutlineLoading3Quarters className="-ml-1 mr-3 h-5 w-5 animate-spin text-white" />
              Resetting password...
            </span>
          ) : (
            'Reset password'
          )}
        </button>
      </div>
    </form>
  );
}
